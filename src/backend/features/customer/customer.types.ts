/** API response shapes for customer records (no raw DB fields). */

export interface AddressRecord {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CustomerRecord {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  profilePicUrl: string;
  addresses: AddressRecord[];
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted when saving a new address. */
export type NewAddress = Omit<AddressRecord, 'id'>;

/**
 * Fields a customer can edit in their profile. An omitted key means "leave
 * unchanged"; an empty `email` string means "clear the saved email".
 */
export interface ProfileUpdateInput {
  name?: string;
  email?: string;
}
