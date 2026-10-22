import { getMongoConnection } from '@/backend/integrations/database/connection';
import CustomerModel, {
  type ICustomer,
  type ICustomerAddress,
} from '@/backend/integrations/database/models/Customer';
import type { AddressRecord, CustomerRecord, NewAddress } from './customer.types';

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
