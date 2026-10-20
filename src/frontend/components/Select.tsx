import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** daisyUI size variant. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<SelectProps['size']>, string> = {
  xs: 'select-xs',
  sm: 'select-sm',
  md: '',
  lg: 'select-lg',
};

/** Shared select. Border/padding come from the global `.select` rule. */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', className = '', children, ...props },
  ref,
) {
  const classes = ['select', SIZE_CLASS[size], className].filter(Boolean).join(' ');
  return (
    <select ref={ref} className={classes} {...props}>
      {children}
    </select>
  );
});

export default Select;
