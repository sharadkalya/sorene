import { getMongoConnection } from '@/backend/integrations/database/connection';
import OrderModel, {
  type IOrderAddress,
  type IOrderItem,
  type IOrderPayment,
  type IOrderReturn,
  type OrderStatus,
} from '@/backend/integrations/database/models/Order';
import type {
  AdminOrderRecord,
  OrderAddressRecord,
  OrderItemRecord,
  OrderPaymentRecord,
  OrderRecord,
  OrderReturnRecord,
  ReturnStatus,
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

export interface OrderPaymentData {
  provider: string;
  providerPaymentId?: string;
  amountInPaise: number;
  currency: string;
  paidAt?: string;
}

export interface OrderData {
  customerId: string;
  customerPhone: string;
  address: OrderAddressData;
  items: OrderItemData[];
  subtotal: number;
  total: number;
  payment?: OrderPaymentData;
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
  status: string;
  payment?: IOrderPayment;
  deliveredAt?: Date;
  return?: IOrderReturn;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Legacy orders were created with `status: 'placed'` or `completed`; map them onto the current lifecycle. */
function normalizeStatus(status: unknown): OrderStatus {
  if (status === 'placed') return 'pending';
  if (status === 'completed') return 'delivered';
  return status as OrderStatus;
}

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

function toOrderPaymentRecord(payment: IOrderPayment | undefined): OrderPaymentRecord | undefined {
  if (!payment) return undefined;
  return {
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    amountInPaise: payment.amountInPaise,
    currency: payment.currency,
    paidAt: payment.paidAt?.toISOString(),
  };
}

function toOrderReturnRecord(returnDoc: IOrderReturn | undefined): OrderReturnRecord | undefined {
  if (!returnDoc) return undefined;
  return {
    status: returnDoc.status,
    requestedAt: returnDoc.requestedAt?.toISOString() ?? '',
    adminNote: returnDoc.adminNote,
    decidedAt: returnDoc.decidedAt?.toISOString(),
  };
}

function toOrderRecord(doc: OrderDoc): OrderRecord {
  return {
    id: doc._id.toString(),
    number: doc.number,
    status: normalizeStatus(doc.status),
    items: (doc.items ?? []).map(toOrderItemRecord),
    subtotal: doc.subtotal,
    total: doc.total,
    createdAt: doc.createdAt?.toISOString() ?? '',
    deliveredAt: doc.deliveredAt?.toISOString(),
    address: toOrderAddressRecord(doc.address),
    payment: toOrderPaymentRecord(doc.payment),
    return: toOrderReturnRecord(doc.return),
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
        status: 'pending',
        payment: data.payment,
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

export interface ListOrdersQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  orders: AdminOrderRecord[];
  total: number;
  page: number;
  totalPages: number;
}

/** List orders, optionally filtered by status and paginated. */
export async function listAllOrders(query: ListOrdersQuery = {}): Promise<PaginatedOrders> {
  await getMongoConnection();

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const filter = query.status ? { status: query.status } : {};

  const [docs, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customerId', 'name phone')
      .exec(),
    OrderModel.countDocuments(filter).exec(),
  ]);

  return {
    orders: docs.map((doc) => toAdminOrderRecord(doc as unknown as OrderDoc)),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Update an order's status; sets `deliveredAt` when the order is delivered. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrderRecord | null> {
  await getMongoConnection();
  const update: Record<string, unknown> = { status };
  if (status === 'delivered') {
    update.deliveredAt = new Date();
  }
  const doc = await OrderModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
  return doc ? toAdminOrderRecord(doc as unknown as OrderDoc) : null;
}

export interface OrderReturnData {
  status: ReturnStatus;
  requestedAt: string | Date;
  adminNote?: string;
  decidedAt?: string | Date;
}

/** Replace the order's return subdocument (create, decide, or progress a return). */
export async function setOrderReturn(
  id: string,
  returnDoc: OrderReturnData,
): Promise<AdminOrderRecord | null> {
  await getMongoConnection();
  const doc = await OrderModel.findByIdAndUpdate(
    id,
    { $set: { return: returnDoc } },
    { new: true },
  ).exec();
  return doc ? toAdminOrderRecord(doc as unknown as OrderDoc) : null;
}
