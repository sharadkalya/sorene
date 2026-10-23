import { AppError } from '@/backend/errors';
import pincodeDirectory, { type PincodeOffice } from 'india-pincode-lookup';
import type { PincodeRecord } from './pincode.types';
import { formatIssues, pincodeInputSchema } from './pincode.validation';

/**
 * Library choice: `india-pincode-lookup` (v1.0.3, MIT).
 *
 * It wraps the All India Pincode Directory published on data.gov.in. The
 * package is a tiny CommonJS module (`main: index.js`) whose default export is
 * `{ lookup }`; `lookup(pincode)` returns an array of matching post-office
 * records (`officeName`, `pincode`, `taluk`, `districtName`, `stateName`). It
 * has no dedicated `city` field, so — per the checkout auto-fill requirements
 * — we use `districtName` for both `district` and `city`. The dataset is an
 * eagerly-loaded ~18 MB `pincodes.json`, which is acceptable for a server
 * route handler (parsed once and cached in memory). Verified under Node 24 and
 * Next 16 (Turbopack): `import pincodeDirectory from 'india-pincode-lookup'`
 * exposes `.lookup` and the route bundles/serves correctly.
 */

/**
 * Look up a pincode and return `{ pincode, city, district, state }`.
 * Validates the input format first, then resolves the pincode against the
 * directory. Throws `AppError('NOT_FOUND', 'Invalid pincode.')` for unknown
 * pincodes and wraps unexpected library failures as `UPSTREAM_ERROR`.
 */
export function lookupPincode(input: unknown): PincodeRecord {
  const parsed = pincodeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  let matches: PincodeOffice[];
  try {
    matches = pincodeDirectory.lookup(parsed.data);
  } catch (error) {
    throw new AppError(
      'UPSTREAM_ERROR',
      'We could not look up that pincode right now. Please try again.',
      { cause: error },
    );
  }

  if (matches.length === 0) {
    throw new AppError('NOT_FOUND', 'Invalid pincode.');
  }

  const record = pickRepresentativeRecord(matches);
  return {
    pincode: parsed.data,
    city: record.districtName,
    district: record.districtName,
    state: record.stateName,
  };
}

/**
 * A pincode can map to several post offices across more than one district.
 * Prefer the district that appears most often so city/state auto-fill reflects
 * the majority area for that pincode.
 */
function pickRepresentativeRecord(records: PincodeOffice[]): PincodeOffice {
  const counts = new Map<string, { count: number; first: PincodeOffice }>();
  for (const record of records) {
    const entry = counts.get(record.districtName);
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(record.districtName, { count: 1, first: record });
    }
  }

  let best = records[0];
  let bestCount = 0;
  for (const entry of counts.values()) {
    if (entry.count > bestCount) {
      best = entry.first;
      bestCount = entry.count;
    }
  }
  return best;
}
