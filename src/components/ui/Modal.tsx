import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  contentClassName?: string;
  closable?: boolean;
  closeOnMaskClick?: boolean;
  closeOnEsc?: boolean;
  footer?: ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  title,
  description,
  children,
  onOpenChange,
  onClose,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  confirmLoading = false,
  confirmDisabled = false,
  showFooter = true,
  showCancel = true,
  size = 'md',
  className,
  contentClassName,
  closable = true,
  closeOnMaskClick = true,
  closeOnEsc = true,
  footer,
}: ModalProps) {
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEsc, onClose, onOpenChange]);

  useEffect(() => {
    if (open) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'p-4',
        className
      )}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          'fixed inset-0',
          'bg-neutral-900/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        onClick={closeOnMaskClick ? handleClose : undefined}
      />

      <div
        className={cn(
          'relative z-10 w-full',
          sizeStyles[size],
          'bg-white rounded-lg shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {(title || closable) && (
          <div
            className={cn(
              'flex items-start justify-between gap-4',
              'px-6 py-5 border-b border-neutral-200'
            )}
          >
            <div className={cn('min-w-0 flex-1')}>
              {title && (
                <h2 className={cn('text-lg font-semibold text-neutral-900 leading-tight')}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={cn('mt-1 text-sm text-neutral-500')}>{description}</p>
              )}
            </div>
            {closable && (
              <button
                onClick={handleClose}
                className={cn(
                  'flex-shrink-0 w-8 h-8 -m-1 flex items-center justify-center',
                  'rounded-md text-neutral-400',
                  'hover:bg-neutral-100 hover:text-neutral-600',
                  'transition-colors duration-200'
                )}
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className={cn('px-6 py-5', contentClassName)}>{children}</div>

        {showFooter && (
          <div
            className={cn(
              'flex items-center justify-end gap-3',
              'px-6 py-4 border-t border-neutral-200',
              'bg-neutral-50/50 rounded-b-lg'
            )}
          >
            {footer ? (
              footer
            ) : (
              <>
                {showCancel && (
                  <Button variant="secondary" onClick={handleClose}>
                    {cancelText}
                  </Button>
                )}
                <Button
                  variant="primary"
                  loading={confirmLoading}
                  disabled={confirmDisabled}
                  onClick={handleConfirm}
                >
                  {confirmText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
