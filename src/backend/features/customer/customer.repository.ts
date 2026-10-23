import { getMongoConnection } from '@/backend/integrations/database/connection';
import CustomerModel, {
  type ICustomer,
  type ICustomerAddress,
} from '@/backend/integrations/database/models/Customer';
import type { AddressRecord, CustomerRecord, NewAddress, ProfileUpdateInput } from './customer.types';

/**
 * Persistence for customers. All database access for this feature lives here;
 * services and route handlers never touch Mongoose models directly.
 */

type CustomerDoc = ICustomer & {
  _id: { toString(): string };
  addresses: Array<ICustomerAddress & { _id: { toString(): string } }>;
  createdAt?: Date;
  updatedAt?: Date;
};

function toAddressRecord(address: CustomerDoc['addresses'][number]): AddressRecord {
  return {
    id: address._id.toString(),
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

function toCustomerRecord(doc: CustomerDoc): CustomerRecord {
  return {
    id: doc._id.toString(),
    phone: doc.phone,
    name: doc.name,
    email: doc.email,
    profilePicUrl: doc.profilePicUrl ?? '',
    addresses: doc.addresses.map(toAddressRecord),
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

/** Create the customer keyed by phone, or return the existing one (idempotent). */
export async function upsertCustomerByPhone(phone: string): Promise<CustomerRecord> {
  await getMongoConnection();

  const result = await CustomerModel.findOneAndUpdate(
    { phone },
    { $setOnInsert: { phone } },
    { new: true, upsert: true, runValidators: true, includeResultMetadata: true },
  );

  return toCustomerRecord(result.value as CustomerDoc);
}

export async function getCustomerById(customerId: string): Promise<CustomerRecord | null> {
  await getMongoConnection();
  const doc = await CustomerModel.findById(customerId);
  return doc ? toCustomerRecord(doc as CustomerDoc) : null;
}

/** Append an address and return the updated customer plus the new address. */
export async function addCustomerAddress(
  customerId: string,
  address: NewAddress,
): Promise<{ customer: CustomerRecord; address: AddressRecord } | null> {
  await getMongoConnection();

  const doc = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $push: { addresses: address } },
    { new: true, runValidators: true },
  );
  if (!doc) {
    return null;
  }

  const customer = toCustomerRecord(doc as CustomerDoc);
  return { customer, address: customer.addresses[customer.addresses.length - 1] };
}

/**
 * Apply a profile patch. A provided `name`/`email` is set; an empty `email`
 * string unsets the field (so the sparse unique index keeps ignoring it).
 * Returns the updated record, or null when the customer is missing.
 */
export async function updateCustomerProfile(
  customerId: string,
  patch: ProfileUpdateInput,
): Promise<CustomerRecord | null> {
  await getMongoConnection();

  const $set: Record<string, unknown> = {};
  const $unset: Record<string, string> = {};

  if (patch.name !== undefined) {
    $set.name = patch.name;
  }
  if (patch.email !== undefined) {
    if (patch.email === '') {
      $unset.email = '';
    } else {
      $set.email = patch.email;
    }
  }

  const update = { ...(Object.keys($set).length > 0 ? { $set } : {}), ...(Object.keys($unset).length > 0 ? { $unset } : {}) };

  const doc = await CustomerModel.findByIdAndUpdate(customerId, update, {
    new: true,
    runValidators: true,
  });
  return doc ? toCustomerRecord(doc as CustomerDoc) : null;
}

/** Persist a public avatar URL for the customer. */
export async function setCustomerProfilePicUrl(
  customerId: string,
  url: string,
): Promise<CustomerRecord | null> {
  await getMongoConnection();

  const doc = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $set: { profilePicUrl: url } },
    { new: true, runValidators: true },
  );
  return doc ? toCustomerRecord(doc as CustomerDoc) : null;
}
