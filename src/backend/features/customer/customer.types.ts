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
  addresses: AddressRecord[];
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted when saving a new address. */
export type NewAddress = Omit<AddressRecord, 'id'>;
