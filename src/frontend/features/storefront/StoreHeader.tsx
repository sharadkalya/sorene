'use client';

import Link from 'next/link';
import { useAppSelector } from '@/frontend/store/hooks';
import { useIsClient } from '@/frontend/hooks/useIsClient';
import { selectCartCount } from '@/frontend/store/slices/cart.slice';
import { selectWishlistCount } from '@/frontend/store/slices/wishlist.slice';
import CatalogSearch from './CatalogSearch';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';

interface StoreHeaderProps {
  isAuthenticated: boolean;
  wishlistCount: number;
}

/** Storefront navigation: brand, shop links, account, wishlist, and cart. */
export default function StoreHeader({ isAuthenticated, wishlistCount }: StoreHeaderProps) {
  const count = useAppSelector(selectCartCount);
  const guestWishlistCount = useAppSelector(selectWishlistCount);
  const isClient = useIsClient();
  const wishlistBadgeCount = isAuthenticated ? wishlistCount : (isClient ? guestWishlistCount : 0);

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
              href="/wishlist"
              variant="ghost"
              shape="square"
              className="relative"
              aria-label="View wishlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {isClient && wishlistBadgeCount > 0 && (
                <Badge variant="primary" size="sm" className="absolute -top-1 -right-1">{wishlistBadgeCount}</Badge>
              )}
            </Button>

            <Button
              href="/account"
              variant="ghost"
              shape="square"
              aria-label="Account"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Button>

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
                <Badge variant="primary" size="sm" className="absolute -top-1 -right-1">{count}</Badge>
              )}
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
