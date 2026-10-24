import { AppError } from '@/backend/errors';
import * as catalogRepo from '../catalog/catalog.repository';
import { getCustomerById } from '../customer/customer.repository';
import * as ordersRepo from './orders.repository';
import type { OrderAddressData, OrderData, OrderItemData, OrderPaymentData } from './orders.repository';
import { formatIssues, orderCreateSchema, type OrderCreateInput } from './orders.validation';
import type { AdminOrderRecord, OrderRecord, OrderStatus } from './orders.types';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

interface ResolvedOrder {
  customerId: string;
  customerPhone: string;
  address: OrderAddressData;
  items: OrderItemData[];
  subtotal: number;
  total: number;
  quantityBySlug: Map<string, number>;
  productBySlug: Map<string, { slug: string; name: string; price: number; image: string; stockQuantity?: number }>;
}

/**
 * Validate the checkout input and resolve server-side prices/stock without any
 * side effects. Shared by `placeOrder` (commits the order) and the payments
 * feature (computes the amount before a payment is created).
 */
async function resolveOrder(customerId: string, input: unknown): Promise<ResolvedOrder> {
  const parsed = orderCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  const data = parsed.data as OrderCreateInput;

  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found.');
  }

  const address = customer.addresses.find((entry) => entry.id === data.addressId);
  if (!address) {
    throw new AppError('VALIDATION_ERROR', 'Address not found.');
  }

  // Aggregate quantities per slug so duplicate line items cannot bypass stock.
  const quantityBySlug = new Map<string, number>();
  for (const item of data.items) {
    quantityBySlug.set(item.slug, (quantityBySlug.get(item.slug) ?? 0) + item.quantity);
  }
  const slugs = [...quantityBySlug.keys()];

  const products = await catalogRepo.getActiveProductsBySlugs(slugs);
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  for (const slug of slugs) {
    if (!productBySlug.has(slug)) {
      throw new AppError('VALIDATION_ERROR', `Unknown product: ${slug}`);
    }
  }

  // Validate every line's stock up front. A stockQuantity of 0/undefined means
  // inventory is not tracked for that product; a positive value is enforced.
  for (const [slug, quantity] of quantityBySlug) {
    const product = productBySlug.get(slug)!;
    const stock = product.stockQuantity;
    if (stock !== undefined && stock !== null && stock > 0 && quantity > stock) {
      throw new AppError('VALIDATION_ERROR', `Insufficient stock for ${product.name}.`);
    }
  }

  const items = slugs.map((slug) => {
    const product = productBySlug.get(slug)!;
    const quantity = quantityBySlug.get(slug)!;
    return {
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      lineTotal: roundMoney(product.price * quantity),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));

  return {
    customerId,
    customerPhone: customer.phone,
    address: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    items,
    subtotal,
    total: subtotal,
    quantityBySlug,
    productBySlug,
  };
}

/** Resolve the payable total for a checkout input without committing anything. */
export async function resolveOrderTotal(customerId: string, input: unknown): Promise<number> {
  return (await resolveOrder(customerId, input)).total;
}

/**
 * Place an order for the authenticated customer: decrements stock and writes
 * the order. Called after a payment succeeds; `payment` snapshots the provider
 * confirmation onto the order.
 */
export async function placeOrder(
  customerId: string,
  input: unknown,
  payment?: OrderPaymentData,
): Promise<OrderRecord> {
  const resolved = await resolveOrder(customerId, input);

  // Decrement tracked inventory. Mongoose lacks multi-document transactions
  // without a replica set, so we validate first and then decrement each line
  // conditionally; if any conditional decrement fails (a race), we abort
  // without creating the order.
  for (const [slug, quantity] of resolved.quantityBySlug) {
    const product = resolved.productBySlug.get(slug)!;
    const stock = product.stockQuantity;
    if (stock !== undefined && stock !== null && stock > 0) {
      const decremented = await catalogRepo.decrementProductStock(slug, quantity);
      if (!decremented) {
        throw new AppError('VALIDATION_ERROR', `Insufficient stock for ${product.name}.`);
      }
    }
  }

  const orderData: OrderData = {
    customerId: resolved.customerId,
    customerPhone: resolved.customerPhone,
    address: resolved.address,
    items: resolved.items,
    subtotal: resolved.subtotal,
    total: resolved.total,
    payment,
  };

  return ordersRepo.createOrder(orderData);
}

export async function listCustomerOrders(customerId: string): Promise<OrderRecord[]> {
  return ordersRepo.listOrdersByCustomer(customerId);
}

/** Strip admin-only identity fields from an admin order record. */
function toCustomerOrderRecord(order: AdminOrderRecord): OrderRecord {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt,
    address: order.address,
    payment: order.payment,
  };
}

/** Returns null when the order is missing or belongs to another customer. */
export async function getCustomerOrder(customerId: string, orderId: string): Promise<OrderRecord | null> {
  const order = await ordersRepo.getOrderById(orderId);
  if (!order || order.customerId !== customerId) {
    return null;
  }
  return toCustomerOrderRecord(order);
}

/** Request cancellation; the order stays active until an admin confirms it. */
export async function requestOrderCancellation(customerId: string, orderId: string): Promise<OrderRecord> {
  const order = await ordersRepo.getOrderById(orderId);
  if (!order || order.customerId !== customerId) {
    throw new AppError('NOT_FOUND', 'Order not found.');
  }
  if (order.status !== 'pending' && order.status !== 'processing') {
    throw new AppError('CONFLICT', 'Only orders that have not been dispatched can be cancelled.');
  }

  const updated = await ordersRepo.updateOrderStatus(orderId, 'cancellation_requested');
  if (!updated) {
    throw new AppError('NOT_FOUND', 'Order not found.');
  }
  return toCustomerOrderRecord(updated);
}

export interface ListAdminOrdersParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export async function listAdminOrders(params: ListAdminOrdersParams = {}) {
  return ordersRepo.listAllOrders(params);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderRecord | null> {
  return ordersRepo.getOrderById(orderId);
}

/** Admin action: move an order to a new status (e.g. complete or cancel). */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<AdminOrderRecord | null> {
  return ordersRepo.updateOrderStatus(orderId, status);
}
