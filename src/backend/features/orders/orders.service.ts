import { AppError } from '@/backend/errors';
import * as catalogRepo from '../catalog/catalog.repository';
import { getCustomerById } from '../customer/customer.repository';
import * as ordersRepo from './orders.repository';
import type { OrderData } from './orders.repository';
import { formatIssues, orderCreateSchema, type OrderCreateInput } from './orders.validation';
import type { AdminOrderRecord, OrderRecord } from './orders.types';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Place an order for the authenticated customer. Prices are resolved from the
 * catalog on the server (the client only sends slug + quantity), stock is
 * validated and decremented before the order is written, and the shipping
 * address is snapshotted onto the order.
 */
export async function placeOrder(customerId: string, input: unknown): Promise<OrderRecord> {
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

  // Resolve active products server-side. The orders feature calls the catalog
  // repository directly (rather than re-implementing product lookup) so pricing
  // and stock rules stay in one place; it is a read/decrement boundary, not a
  // layering violation.
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

  // Decrement tracked inventory. Mongoose lacks multi-document transactions
  // without a replica set, so we validate first and then decrement each line
  // conditionally; if any conditional decrement fails (a race), we abort
  // without creating the order.
  for (const [slug, quantity] of quantityBySlug) {
    const product = productBySlug.get(slug)!;
    const stock = product.stockQuantity;
    if (stock !== undefined && stock !== null && stock > 0) {
      const decremented = await catalogRepo.decrementProductStock(slug, quantity);
      if (!decremented) {
        throw new AppError('VALIDATION_ERROR', `Insufficient stock for ${product.name}.`);
      }
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

  const orderData: OrderData = {
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
  };

  return ordersRepo.createOrder(orderData);
}

export async function listCustomerOrders(customerId: string): Promise<OrderRecord[]> {
  return ordersRepo.listOrdersByCustomer(customerId);
}

/** Returns null when the order is missing or belongs to another customer. */
export async function getCustomerOrder(customerId: string, orderId: string): Promise<OrderRecord | null> {
  const order = await ordersRepo.getOrderById(orderId);
  if (!order || order.customerId !== customerId) {
    return null;
  }

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt,
    address: order.address,
  };
}

export async function listAdminOrders(): Promise<AdminOrderRecord[]> {
  return ordersRepo.listAllOrders();
}
