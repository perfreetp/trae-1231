import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${componentName} must be used within <Tabs>`);
  }
  return context;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export default function Tabs({
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 p-1',
        'bg-neutral-100 rounded-md',
        'w-fit',
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export function TabsTrigger({
  value: tabValue,
  children,
  className,
  disabled = false,
  icon,
}: TabsTriggerProps) {
  const { value, onChange } = useTabsContext('TabsTrigger');
  const isActive = value === tabValue;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onChange(tabValue)}
      className={cn(
        'relative inline-flex items-center justify-center',
        'h-8 px-4 text-sm font-medium',
        'rounded-md',
        'transition-all duration-200',
        isActive
          ? cn(
              'bg-white text-neutral-900',
              'shadow-sm ring-1 ring-neutral-200'
            )
          : cn(
              'text-neutral-600',
              'hover:text-neutral-900',
              'hover:bg-white/60',
              disabled && 'text-neutral-400 cursor-not-allowed hover:bg-transparent'
            ),
        className
      )}
    >
      {icon && <span className={cn('mr-2 inline-flex')}>{icon}</span>}
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({
  value: tabValue,
  children,
  className,
}: TabsContentProps) {
  const { value } = useTabsContext('TabsContent');

  if (value !== tabValue) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-4',
        'animate-in fade-in duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
