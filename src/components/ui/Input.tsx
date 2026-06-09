import type { InputHTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef, isValidElement, useState } from 'react';
import { Eye, EyeOff, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function renderIcon(icon: LucideIcon | ReactNode | undefined): ReactNode {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const IconComponent = icon as LucideIcon;
  return <IconComponent />;
}

type InputSize = 'sm' | 'md';
type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'datetime-local' | 'date' | 'time';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  type?: InputType;
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: LucideIcon | ReactNode;
  rightIcon?: LucideIcon | ReactNode;
  showPasswordToggle?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  containerClassName?: string;
  inputWrapperClassName?: string;
}

const sizeStyles: Record<InputSize, { wrapper: string; input: string }> = {
  sm: {
    wrapper: 'h-8 [&_svg]:w-4 [&_svg]:h-4',
    input: 'px-3 text-xs',
  },
  md: {
    wrapper: 'h-9 [&_svg]:w-4 [&_svg]:h-4',
    input: 'px-3.5 text-sm',
  },
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      size = 'md',
      label,
      error,
      hint,
      required = false,
      className,
      containerClassName,
      inputWrapperClassName,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      showPasswordToggle,
      showClear,
      onClear,
      value,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const isPasswordType = type === 'password';
    const hasPasswordToggle = isPasswordType && showPasswordToggle;
    const finalType = isPasswordType && showPassword ? 'text' : type;
    const hasValue = value !== undefined && value !== null && value !== '';

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-neutral-700 mb-1.5',
              required && "after:content-['*'] after:ml-0.5 after:text-danger-500"
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'relative w-full flex items-center',
            'rounded-md border bg-white',
            'transition-all duration-200',
            'group',
            sizeStyles[size].wrapper,
            error
              ? cn(
                  'border-danger-300',
                  'focus-within:ring-2 focus-within:ring-danger-500 focus-within:border-danger-500'
                )
              : cn(
                  'border-neutral-300',
                  'hover:border-neutral-400',
                  'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500'
                ),
            disabled && cn(
              'bg-neutral-50 border-neutral-200 cursor-not-allowed',
              'hover:border-neutral-200'
            ),
            inputWrapperClassName
          )}
        >
          {LeftIcon && (
            <span
              className={cn(
                'flex items-center justify-center flex-shrink-0',
                'pl-3 pr-1.5',
                'text-neutral-400',
                disabled && 'text-neutral-300'
              )}
            >
              {renderIcon(LeftIcon)}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={finalType}
            disabled={disabled}
            value={value}
            className={cn(
              'flex-1 min-w-0 h-full bg-transparent',
              'text-neutral-900 placeholder:text-neutral-400',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:text-neutral-400',
              'transition-colors duration-200',
              sizeStyles[size].input,
              !LeftIcon && 'pl-0',
              !RightIcon && !hasPasswordToggle && !showClear && 'pr-0',
              className
            )}
            {...props}
          />

          <span
            className={cn(
              'flex items-center gap-1 flex-shrink-0',
              'pr-3 pl-1.5'
            )}
          >
            {showClear && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                tabIndex={-1}
                className={cn(
                  'flex items-center justify-center rounded-sm',
                  'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                  'transition-colors duration-200'
                )}
                aria-label="清除"
              >
                <X />
              </button>
            )}
            {RightIcon && (
              <span
                className={cn(
                  'flex items-center justify-center',
                  'text-neutral-400',
                  disabled && 'text-neutral-300'
                )}
              >
                {renderIcon(RightIcon)}
              </span>
            )}
            {hasPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className={cn(
                  'flex items-center justify-center rounded-sm',
                  'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                  'transition-colors duration-200'
                )}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            )}
          </span>
        </div>

        {error && <p className={cn('mt-1.5 text-xs text-danger-600')}>{error}</p>}
        {!error && hint && <p className={cn('mt-1.5 text-xs text-neutral-500')}>{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
