import { AppError } from '@/backend/errors';
import { addCustomerAddress as repoAddAddress, getCustomerById } from './customer.repository';
import type { AddressRecord, CustomerRecord } from './customer.types';
import { addressInputSchema, formatIssues } from './customer.validation';

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
