import { getMongoConnection } from '@/backend/integrations/database/connection';
import OrderModel, {
  type IOrderAddress,
  type IOrderItem,
} from '@/backend/integrations/database/models/Order';
import type {
  AdminOrderRecord,
  OrderAddressRecord,
  OrderItemRecord,
  OrderRecord,
} from './orders.types';

/**
 * Persistence for the orders feature. Every function awaits the shared
 * Mongoose connection before touching the model.
 */

export interface OrderItemData {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressData {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderData {
  customerId: string;
  customerPhone: string;
  address: OrderAddressData;
  items: OrderItemData[];
  subtotal: number;
  total: number;
}

type CustomerIdLike = {
  _id?: { toString(): string };
  name?: string;
  phone?: string;
  toString?(): string;
};

type OrderDoc = {
  _id: { toString(): string };
  number: string;
  customerId: CustomerIdLike;
  customerPhone: string;
  address: IOrderAddress;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  status: 'placed';
  createdAt?: Date;
  updatedAt?: Date;
};

function toOrderItemRecord(item: IOrderItem): OrderItemRecord {
  return {
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image ?? '',
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  };
}

function toOrderAddressRecord(address: IOrderAddress): OrderAddressRecord {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

function toOrderRecord(doc: OrderDoc): OrderRecord {
  return {
    id: doc._id.toString(),
    number: doc.number,
    status: doc.status,
    items: (doc.items ?? []).map(toOrderItemRecord),
    subtotal: doc.subtotal,
    total: doc.total,
    createdAt: doc.createdAt?.toISOString() ?? '',
    address: toOrderAddressRecord(doc.address),
  };
}

function customerIdToString(customerId: CustomerIdLike): string {
  if (customerId._id && typeof customerId._id.toString === 'function') {
    return customerId._id.toString();
  }
  if (typeof customerId.toString === 'function') {
    return customerId.toString();
  }
  return '';
}

function toAdminOrderRecord(doc: OrderDoc): AdminOrderRecord {
  return {
    ...toOrderRecord(doc),
    customerId: customerIdToString(doc.customerId),
    customerPhone: doc.customerPhone,
    customerName: doc.customerId?.name,
  };
}

function generateOrderNumber(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `SR-${y}${m}${d}-${suffix}`;
}

/** Create an order with a unique human number, retrying on duplicate-key races. */
export async function createOrder(data: OrderData): Promise<OrderRecord> {
  await getMongoConnection();

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const doc = await OrderModel.create({
        customerId: data.customerId,
        customerPhone: data.customerPhone,
        address: data.address,
        items: data.items,
        subtotal: data.subtotal,
        total: data.total,
        status: 'placed',
        number: generateOrderNumber(),
      });
      return toOrderRecord(doc as unknown as OrderDoc);
    } catch (error) {
      lastError = error;
      // 11000 is MongoDB's duplicate-key code; regenerate the number and retry.
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function listOrdersByCustomer(customerId: string): Promise<OrderRecord[]> {
  await getMongoConnection();
  const docs = await OrderModel.find({ customerId }).sort({ createdAt: -1 }).exec();
  return docs.map((doc) => toOrderRecord(doc as unknown as OrderDoc));
}

export async function getOrderById(id: string): Promise<AdminOrderRecord | null> {
  await getMongoConnection();
  const doc = await OrderModel.findById(id).exec();
  return doc ? toAdminOrderRecord(doc as unknown as OrderDoc) : null;
}

export async function listAllOrders(): Promise<AdminOrderRecord[]> {
  await getMongoConnection();
  const docs = await OrderModel.find()
    .sort({ createdAt: -1 })
    .populate('customerId', 'name phone')
    .exec();
  return docs.map((doc) => toAdminOrderRecord(doc as unknown as OrderDoc));
}
