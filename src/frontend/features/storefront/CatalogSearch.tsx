'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';
import TextInput from '@/frontend/components/TextInput';

interface CatalogSearchProps {
  basePath: string;
  initialValue?: string;
  /** Merge with the current page's query params (sidebar) vs start fresh (header). */
  preserveParams?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Debounced, URL-driven catalog search with an in-field clear button. */
export default function CatalogSearch({
  basePath,
  initialValue = '',
  preserveParams = true,
  size = 'sm',
  className,
}: CatalogSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const commit = (next: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const q = next.trim();
    const query = preserveParams ? new URLSearchParams(window.location.search) : new URLSearchParams();
    if (q) query.set('q', q);
    else query.delete('q');

    const qs = query.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => commit(next), 300);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit(value);
  };

  const handleClear = () => {
    setValue('');
    commit('');
  };

  return (
    <form onSubmit={handleSubmit} role="search" className={className}>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <TextInput
          type="search"
          size={size}
          value={value}
          onChange={handleChange}
          placeholder="Search products"
          aria-label="Search products"
          style={{
            paddingInlineStart: '2.25rem',
            paddingInlineEnd: value ? '2.25rem' : undefined,
          }}
        />
        {value && (
          <Button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            variant="ghost"
            size="xs"
            shape="square"
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>
    </form>
  );
}
