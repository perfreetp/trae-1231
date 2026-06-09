import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  block?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-primary-800 text-white',
    'border border-primary-800',
    'hover:bg-primary-700 hover:border-primary-700 hover:shadow-sm',
    'active:bg-primary-900 active:border-primary-900',
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'disabled:bg-primary-300 disabled:border-primary-300 disabled:text-white'
  ),
  secondary: cn(
    'bg-white text-neutral-700',
    'border border-neutral-300',
    'hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900',
    'active:bg-neutral-100',
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'disabled:bg-neutral-50 disabled:border-neutral-200 disabled:text-neutral-400'
  ),
  danger: cn(
    'bg-danger-600 text-white',
    'border border-danger-600',
    'hover:bg-danger-700 hover:border-danger-700 hover:shadow-sm',
    'active:bg-danger-800 active:border-danger-800',
    'focus:ring-2 focus:ring-danger-500 focus:ring-offset-2',
    'disabled:bg-danger-300 disabled:border-danger-300 disabled:text-white'
  ),
  ghost: cn(
    'bg-transparent text-neutral-600',
    'border border-transparent',
    'hover:bg-neutral-100 hover:text-neutral-900',
    'active:bg-neutral-200',
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'disabled:text-neutral-300'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: cn('h-8 px-3 text-xs gap-1.5', '[&_svg]:w-4 [&_svg]:h-4'),
  md: cn('h-9 px-4 text-sm gap-2', '[&_svg]:w-4 [&_svg]:h-4'),
  lg: cn('h-11 px-6 text-base gap-2.5', '[&_svg]:w-5 [&_svg]:h-5'),
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon: Icon,
      iconPosition = 'left',
      leftIcon,
      rightIcon,
      block = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center',
          'font-medium whitespace-nowrap',
          'rounded-md outline-none',
          'transition-all duration-200 ease-out',
          'select-none',
          variantStyles[variant],
          sizeStyles[size],
          block && 'w-full',
          isDisabled && 'cursor-not-allowed opacity-70',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin flex-shrink-0" />}
        {!loading && Icon && iconPosition === 'left' && <Icon className="flex-shrink-0" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children && <span className="inline-flex">{children}</span>}
        {!loading && Icon && iconPosition === 'right' && <Icon className="flex-shrink-0" />}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
