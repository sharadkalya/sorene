import { forwardRef, type InputHTMLAttributes } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** daisyUI size variant. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Shared text input. Border and padding come from the global `.input` rule;
 * this component standardizes the daisyUI size variant and full width.
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { size = 'md', className = '', ...props },
  ref,
) {
  const classes = ['input', `input-${size}`, 'w-full', className].filter(Boolean).join(' ');
  return <input ref={ref} className={classes} {...props} />;
});

export default TextInput;
