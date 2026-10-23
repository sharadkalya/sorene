/** Shared types for the account feature. */

export interface AccountAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AccountCustomer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  profilePicUrl: string;
  addresses: AccountAddress[];
}
