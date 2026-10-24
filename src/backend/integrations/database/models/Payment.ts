import mongoose, { Schema, type Types } from 'mongoose';

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface IPaymentCheckoutItem {
  slug: string;
  quantity: number;
}

export interface IPaymentCheckout {
  addressId: string;
  items: IPaymentCheckoutItem[];
}

export interface IPayment {
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  orderId?: Types.ObjectId;
  customerId: Types.ObjectId;
  amountInPaise: number;
  currency: string;
  status: PaymentStatus;
  checkout?: IPaymentCheckout;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentCheckoutItemSchema = new Schema<IPaymentCheckoutItem>(
  {
    slug: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const PaymentCheckoutSchema = new Schema<IPaymentCheckout>(
  {
    addressId: { type: String, required: true },
    items: { type: [PaymentCheckoutItemSchema], required: true },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    provider: { type: String, required: true, trim: true },
    providerOrderId: { type: String, required: true, unique: true, trim: true },
    providerPaymentId: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amountInPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    checkout: { type: PaymentCheckoutSchema },
  },
  { timestamps: true },
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ customerId: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
