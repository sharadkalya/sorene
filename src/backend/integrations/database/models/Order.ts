import mongoose, { Schema, type Types } from 'mongoose';

export type OrderStatus = 'placed';

export interface IOrderItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  number: string;
  customerId: Types.ObjectId;
  customerPhone: string;
  address: IOrderAddress;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    number: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerPhone: { type: String, required: true, trim: true },
    address: { type: OrderAddressSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['placed'], default: 'placed' },
  },
  { timestamps: true },
);

OrderSchema.index({ number: 1 }, { unique: true });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
