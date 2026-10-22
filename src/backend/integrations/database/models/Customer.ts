import mongoose from 'mongoose';

export interface ICustomerAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ICustomer {
  phone: string;
  name?: string;
  addresses: ICustomerAddress[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AddressSchema = new mongoose.Schema<ICustomerAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const CustomerSchema = new mongoose.Schema<ICustomer>(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true },
);

CustomerSchema.index({ phone: 1 });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
