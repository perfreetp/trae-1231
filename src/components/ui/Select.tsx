import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type OptionHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  error?: string;
  required?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: cn('h-8 text-xs px-3 [&_svg]:w-4 [&_svg]:h-4'),
  md: cn('h-9 text-sm px-3.5 [&_svg]:w-4 [&_svg]:h-4'),
};

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = '请选择',
      disabled = false,
      clearable = true,
      size = 'md',
      label,
      error,
      required = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optValue: string) => {
      if (optValue !== value) {
        onChange?.(optValue);
      }
      setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    };

    const showClear = clearable && value && !disabled;

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium text-neutral-700 mb-1.5',
              required && "after:content-['*'] after:ml-0.5 after:text-danger-500"
            )}
          >
            {label}
          </label>
        )}
        <div ref={containerRef} className={cn('relative')}>
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => !disabled && setOpen(!open)}
            className={cn(
              'w-full flex items-center justify-between gap-2',
              'rounded-md border text-left',
              'bg-white',
              'transition-all duration-200',
              'focus:outline-none',
              sizeStyles[size],
              error
                ? cn(
                    'border-danger-300',
                    'focus:ring-2 focus:ring-danger-500 focus:border-danger-500'
                  )
                : cn(
                    'border-neutral-300',
                    'hover:border-neutral-400',
                    'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    open && 'ring-2 ring-primary-500 border-primary-500'
                  ),
              disabled && cn(
                'bg-neutral-50 border-neutral-200 cursor-not-allowed',
                'text-neutral-400'
              )
            )}
          >
            <span className={cn('flex-1 min-w-0 truncate', !selectedOption && 'text-neutral-400')}>
              {selectedOption ? (
                <span className={cn('flex items-center gap-2')}>
                  {selectedOption.icon && (
                    <span className="flex-shrink-0 inline-flex">{selectedOption.icon}</span>
                  )}
                  {selectedOption.label}
                </span>
              ) : (
                placeholder
              )}
            </span>
            <span className={cn('flex items-center gap-1 flex-shrink-0')}>
              {showClear && (
                <span
                  onClick={handleClear}
                  className={cn(
                    'w-5 h-5 flex items-center justify-center rounded-sm',
                    'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                    'transition-colors duration-200'
                  )}
                >
                  <X />
                </span>
              )}
              <ChevronDown
                className={cn(
                  'text-neutral-400',
                  'transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </span>
          </button>

          {open && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 z-20 mt-1.5',
                'bg-white border border-neutral-200 rounded-md shadow-lg',
                'py-1 max-h-72 overflow-y-auto',
                'animate-in fade-in slide-in-from-top-2 duration-150'
              )}
            >
              {options.length === 0 ? (
                <div className={cn('px-4 py-6 text-sm text-center text-neutral-400')}>
                  暂无选项
                </div>
              ) : (
                options.map((opt) => (
                  <SelectOptionItem
                    key={opt.value}
                    option={opt}
                    selected={opt.value === value}
                    onSelect={() => !opt.disabled && handleSelect(opt.value)}
                  />
                ))
              )}
            </div>
          )}
        </div>
        {error && (
          <p className={cn('mt-1.5 text-xs text-danger-600')}>{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface SelectOptionItemProps extends OptionHTMLAttributes<HTMLDivElement> {
  option: SelectOption;
  selected: boolean;
  onSelect: () => void;
}

function SelectOptionItem({ option, selected, onSelect }: SelectOptionItemProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3.5 py-2.5 cursor-pointer',
        'text-sm',
        'transition-colors duration-150',
        option.disabled
          ? cn('text-neutral-300 cursor-not-allowed')
          : selected
          ? cn('bg-primary-50 text-primary-800')
          : cn(
              'text-neutral-700',
              'hover:bg-neutral-50 hover:text-neutral-900'
            )
      )}
    >
      {option.icon && <span className="flex-shrink-0 inline-flex">{option.icon}</span>}
      <span className="flex-1 min-w-0">
        <div className={cn('truncate')}>{option.label}</div>
        {option.description && (
          <div
            className={cn(
              'text-xs mt-0.5',
              selected ? 'text-primary-600' : 'text-neutral-400'
            )}
          >
            {option.description}
          </div>
        )}
      </span>
      {selected && <Check className={cn('w-4 h-4 flex-shrink-0 text-primary-600')} />}
    </div>
  );
}

export default Select;
