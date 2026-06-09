import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  extra?: ReactNode;
}

const defaultBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: '首页' }, { label: '地图总览' }],
  '/diseases': [{ label: '首页', href: '/' }, { label: '病害台账' }],
  '/orders': [{ label: '首页', href: '/' }, { label: '工单调度' }],
  '/review': [{ label: '首页', href: '/' }, { label: '现场复核' }],
  '/acceptance': [{ label: '首页', href: '/' }, { label: '维修验收' }],
  '/reports': [{ label: '首页', href: '/' }, { label: '统计报表' }],
  '/settings': [{ label: '首页', href: '/' }, { label: '设置' }],
};

function resolveBreadcrumbs(pathname: string, custom?: BreadcrumbItem[]): BreadcrumbItem[] {
  if (custom) return custom;
  if (defaultBreadcrumbMap[pathname]) return defaultBreadcrumbMap[pathname];
  for (const prefix of Object.keys(defaultBreadcrumbMap)) {
    if (pathname.startsWith(prefix) && prefix !== '/') {
      return defaultBreadcrumbMap[prefix];
    }
  }
  return [{ label: '首页', href: '/' }, { label: '当前页面' }];
}

function resolveTitle(pathname: string, customTitle?: string): string {
  if (customTitle) return customTitle;
  const map: Record<string, string> = {
    '/': '地图总览',
    '/diseases': '病害台账',
    '/orders': '工单调度',
    '/review': '现场复核',
    '/acceptance': '维修验收',
    '/reports': '统计报表',
    '/settings': '设置',
  };
  if (map[pathname]) return map[pathname];
  for (const prefix of Object.keys(map)) {
    if (pathname.startsWith(prefix) && prefix !== '/') return map[prefix];
  }
  return '';
}

export default function PageContainer({
  title,
  subtitle,
  children,
  className,
  breadcrumbs,
  actions,
  extra,
}: PageContainerProps) {
  const location = useLocation();
  const resolvedBreadcrumbs = resolveBreadcrumbs(location.pathname, breadcrumbs);
  const resolvedTitle = resolveTitle(location.pathname, title);

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <div className={cn('mb-6')}>
        <nav className={cn('flex items-center text-sm mb-3')}>
          {resolvedBreadcrumbs.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className={cn('flex items-center')}>
                {index > 0 && (
                  <ChevronRight className={cn('w-4 h-4 mx-2 text-neutral-400')} />
                )}
                <div className={cn('flex items-center gap-1.5')}>
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.href ? (
                    <Link
                      to={item.href}
                      className={cn(
                        'text-neutral-500 hover:text-primary-600',
                        'transition-colors duration-200'
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        index === resolvedBreadcrumbs.length - 1
                          ? 'text-neutral-900 font-medium'
                          : 'text-neutral-500'
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={cn('flex items-start justify-between gap-4')}>
          <div className={cn('min-w-0 flex-1')}>
            {resolvedTitle && (
              <h1 className={cn('text-2xl font-semibold text-neutral-900 tracking-tight')}>
                {resolvedTitle}
              </h1>
            )}
            {subtitle && (
              <p className={cn('mt-1.5 text-sm text-neutral-500')}>{subtitle}</p>
            )}
          </div>
          {actions && <div className={cn('flex items-center gap-2 flex-shrink-0')}>{actions}</div>}
        </div>

        {extra && <div className={cn('mt-4')}>{extra}</div>}
      </div>

      <div className={cn('flex-1 min-h-0')}>{children}</div>
    </div>
  );
}
