import { AppError } from '@/backend/errors';
import { uploadImage } from '@/backend/integrations/storage/r2-storage';
import {
  addCustomerAddress as repoAddAddress,
  getCustomerById,
  setCustomerProfilePicUrl,
  updateCustomerProfile as repoUpdateProfile,
} from './customer.repository';
import type { AddressRecord, CustomerRecord, ProfileUpdateInput } from './customer.types';
import { addressInputSchema, formatIssues, profileUpdateSchema } from './customer.validation';

export async function getCustomer(customerId: string): Promise<CustomerRecord> {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return customer;
}

/** Like `getCustomer` but returns `null` instead of throwing (for pages). */
export async function getCustomerOrNull(customerId: string): Promise<CustomerRecord | null> {
  return getCustomerById(customerId);
}

export async function addCustomerAddress(
  customerId: string,
  input: unknown,
): Promise<{ customer: CustomerRecord; address: AddressRecord }> {
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  const result = await repoAddAddress(customerId, parsed.data);
  if (!result) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Update the signed-in customer's editable profile fields (name, email). */
export async function updateCustomerProfile(
  customerId: string,
  input: unknown,
): Promise<CustomerRecord> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }

  const patch: ProfileUpdateInput = {};
  if (parsed.data.name !== undefined) {
    patch.name = parsed.data.name;
  }
  // Only touch email when the key was present in the request: an empty string
  // (transformed to `undefined`) clears it, a missing key leaves it unchanged.
  if (isRecord(input) && 'email' in input) {
    patch.email = parsed.data.email ?? '';
  }

  const customer = await repoUpdateProfile(customerId, patch);
  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }
  return customer;
}

/**
 * Upload a profile picture to R2 (`avatars` folder) and persist its public
 * URL. `uploadImage` enforces content-type and the 10MB size limit.
 */
export async function updateCustomerAvatar(
  customerId: string,
  file: { buffer: Buffer; contentType: string },
): Promise<{ customer: CustomerRecord; profilePicUrl: string }> {
  const uploaded = await uploadImage({
    buffer: file.buffer,
    contentType: file.contentType,
    folder: 'avatars',
  });

  const customer = await setCustomerProfilePicUrl(customerId, uploaded.url);
  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }

  return { customer, profilePicUrl: uploaded.url };
}
