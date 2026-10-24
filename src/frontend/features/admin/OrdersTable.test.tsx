// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => '/admin/orders',
  useSearchParams: () => mocks.searchParams,
}));

import OrdersTable from './OrdersTable';

const orders = [
  {
    id: 'o1',
    number: 'SR-20261023-1234',
    status: 'pending' as const,
    items: [{ slug: 'bag', name: 'Bag', price: 240, image: '', quantity: 2, lineTotal: 480 }],
    subtotal: 480,
    total: 480,
    createdAt: '2026-10-23T00:00:00.000Z',
    address: {
      fullName: 'Jane Doe',
      phone: '+919876543210',
      line1: '12 Palm Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    customerId: 'c1',
    customerPhone: '+919876543210',
    customerName: 'Jane Doe',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.searchParams = new URLSearchParams();
});

afterEach(() => {
  cleanup();
});

describe('OrdersTable', () => {
  it('renders order rows with number, customer, item count, and status', () => {
    render(<OrdersTable orders={orders} total={1} page={1} totalPages={1} currentStatus={null} />);

    expect(screen.getByText('SR-20261023-1234')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('2 items')).toBeTruthy();
    expect(screen.getByText('Pending', { selector: 'span' })).toBeTruthy();
  });

  it('navigates to the order detail page when a row is clicked', () => {
    render(<OrdersTable orders={orders} total={1} page={1} totalPages={1} currentStatus={null} />);

    fireEvent.click(screen.getByText('SR-20261023-1234'));

    expect(mocks.push).toHaveBeenCalledWith('/admin/orders/o1');
  });

  it('resets the page when the status filter changes', () => {
    mocks.searchParams = new URLSearchParams({ status: 'pending', page: '3' });
    render(<OrdersTable orders={orders} total={40} page={3} totalPages={2} currentStatus="pending" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));

    expect(mocks.push).toHaveBeenCalledWith('/admin/orders?status=delivered');
  });

  it('navigates to the next page preserving the status filter', () => {
    mocks.searchParams = new URLSearchParams({ status: 'pending' });
    render(<OrdersTable orders={orders} total={40} page={1} totalPages={2} currentStatus="pending" />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(mocks.push).toHaveBeenCalledWith('/admin/orders?status=pending&page=2');
  });

  it('disables Previous on the first page and Next on the last page', () => {
    const view = render(
      <OrdersTable orders={orders} total={40} page={1} totalPages={2} currentStatus={null} />,
    );

    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(
      false,
    );

    view.rerender(<OrdersTable orders={orders} total={40} page={2} totalPages={2} currentStatus={null} />);

    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
