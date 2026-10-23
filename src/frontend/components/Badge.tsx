import Link from 'next/link';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';

type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'outline'
  | 'ghost';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: 'badge-neutral',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  outline: 'badge-outline',
  ghost: 'badge-ghost',
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  xs: 'badge-xs',
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg',
};

interface BadgeBaseProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}

type BadgeProps =
  | (BadgeBaseProps & { as?: 'span' } & HTMLAttributes<HTMLSpanElement>)
  | (BadgeBaseProps & { as: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | (BadgeBaseProps & { as: 'a'; href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>);

/** Shared badge with consistent padding, variants, and optional button/link mode. */
export default function Badge(props: BadgeProps) {
  const { variant = 'neutral', size = 'md', className = '', children, ...rest } = props;
  const classes = ['badge', VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(' ');

  if (props.as === 'button') {
    return (
      <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }

  if (props.as === 'a') {
    return (
      <Link href={props.href} className={classes} {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)}>
        {children}
      </Link>
    );
  }

  return (
    <span className={classes} {...(rest as HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
}
