import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: cn(
    'bg-success-50 text-success-700 border-success-200',
    '[&_[data-dot]]:bg-success-500'
  ),
  warning: cn(
    'bg-warning-50 text-warning-700 border-warning-200',
    '[&_[data-dot]]:bg-warning-500'
  ),
  danger: cn(
    'bg-danger-50 text-danger-700 border-danger-200',
    '[&_[data-dot]]:bg-danger-500'
  ),
  info: cn(
    'bg-info-50 text-info-700 border-info-200',
    '[&_[data-dot]]:bg-info-500'
  ),
  neutral: cn(
    'bg-neutral-100 text-neutral-700 border-neutral-200',
    '[&_[data-dot]]:bg-neutral-500'
  ),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: cn('h-5 px-2 text-[11px] gap-1', '[&_svg]:w-3 [&_svg]:h-3', '[&_[data-dot]]:w-1.5 [&_[data-dot]]:h-1.5'),
  md: cn('h-6 px-2.5 text-xs gap-1.5', '[&_svg]:w-3.5 [&_svg]:h-3.5', '[&_[data-dot]]:w-2 [&_[data-dot]]:h-2'),
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      icon,
      dot = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'font-medium whitespace-nowrap',
          'rounded-md border',
          'leading-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            data-dot
            className={cn('rounded-full flex-shrink-0')}
          />
        )}
        {icon && <span className="flex-shrink-0 inline-flex">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
