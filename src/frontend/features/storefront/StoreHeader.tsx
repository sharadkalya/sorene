'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector } from '@/frontend/store/hooks';
import { selectCartCount } from '@/frontend/store/slices/cart.slice';
import CartDrawer from './CartDrawer';

/** Storefront navigation: brand, shop links, and a cart drawer trigger. */
export default function StoreHeader() {
  const count = useAppSelector(selectCartCount);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur border-b border-base-300">
        <div className="navbar max-w-7xl mx-auto px-4">
          <div className="navbar-start">
            <Link href="/" className="text-xl font-semibold tracking-wide">
              SORvÈNE
            </Link>
          </div>

          <div className="navbar-center hidden md:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              <li>
                <Link href="/shop">Shop All</Link>
              </li>
              <li>
                <Link href="/shop/collections">Collections</Link>
              </li>
              <li>
                <Link href="/shop/categories">Categories</Link>
              </li>
            </ul>
          </div>

          <div className="navbar-end gap-2">
            <div className="dropdown dropdown-end md:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box shadow w-52 mt-3 z-50">
                <li><Link href="/shop">Shop All</Link></li>
                <li><Link href="/shop/collections">Collections</Link></li>
                <li><Link href="/shop/categories">Categories</Link></li>
              </ul>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="btn btn-ghost btn-square relative"
              aria-label="Open cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {count > 0 && (
                <span className="badge badge-primary badge-sm absolute -top-1 -right-1">{count}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
