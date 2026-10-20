import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'secondary' | 'accent' | 'neutral' | 'outline' | 'ghost' | 'link' | 'error';
type Size = 'xs' | 'sm' | 'md' | 'lg';
type Shape = 'default' | 'square' | 'circle';

const VARIANT_CLASS: Record<Variant, string> = {
  default: '',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  neutral: 'btn-neutral',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  link: 'btn-link',
  error: 'btn-error',
};

const SIZE_CLASS: Record<Size, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const SHAPE_CLASS: Record<Shape, string> = {
  default: '',
  square: 'btn-square',
  circle: 'btn-circle',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  /** Render as a Next.js Link to this path instead of a <button>. */
  href?: string;
  children: ReactNode;
}

/** Shared button with daisyUI variants, sizes, shapes, and optional link mode. */
export default function Button({
  variant = 'default',
  size = 'md',
  shape = 'default',
  href,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], SHAPE_CLASS[shape], className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    const { disabled, type, ...linkProps } = props;
    const anchorProps = linkProps as unknown as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
