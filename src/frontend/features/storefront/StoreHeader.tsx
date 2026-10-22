'use client';

import Link from 'next/link';
import { useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import { selectCartCount } from '@/frontend/store/slices/cart.slice';
import CatalogSearch from './CatalogSearch';
import Button from '@/frontend/components/Button';

/** Storefront navigation: brand, shop links, and a cart link. */
export default function StoreHeader() {
  const count = useAppSelector(selectCartCount);
  const isClient = useIsClient();

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
            <CatalogSearch
              basePath="/shop"
              preserveParams={false}
              size="sm"
              className="hidden lg:block w-48"
            />
            <div className="dropdown dropdown-end md:hidden">
              <Button variant="ghost" shape="square">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box shadow w-64 mt-3 z-50">
                <div className="p-3 border-b border-base-300">
                  <CatalogSearch basePath="/shop" preserveParams={false} size="sm" />
                </div>
                <ul className="menu p-2 w-full">
                  <li><Link href="/shop">Shop All</Link></li>
                  <li><Link href="/shop/collections">Collections</Link></li>
                  <li><Link href="/shop/categories">Categories</Link></li>
                </ul>
              </div>
            </div>

            <Button
              href="/cart"
              variant="ghost"
              shape="square"
              className="relative"
              aria-label="View cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {isClient && count > 0 && (
                <span className="badge badge-primary badge-sm absolute -top-1 -right-1">{count}</span>
              )}
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
