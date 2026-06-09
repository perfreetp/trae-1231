import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: '首页' }, { label: '地图总览' }],
  '/diseases': [{ label: '首页', href: '/' }, { label: '病害台账' }],
  '/orders': [{ label: '首页', href: '/' }, { label: '工单调度' }],
  '/review': [{ label: '首页', href: '/' }, { label: '现场复核' }],
  '/acceptance': [{ label: '首页', href: '/' }, { label: '维修验收' }],
  '/reports': [{ label: '首页', href: '/' }, { label: '统计报表' }],
  '/settings': [{ label: '首页', href: '/' }, { label: '设置' }],
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (routeMap[pathname]) return routeMap[pathname];
  for (const prefix of Object.keys(routeMap)) {
    if (pathname.startsWith(prefix) && prefix !== '/') {
      return routeMap[prefix];
    }
  }
  return [{ label: '首页', href: '/' }, { label: '当前页面' }];
}

function getPageTitle(pathname: string): string {
  const breadcrumbs = getBreadcrumbs(pathname);
  return breadcrumbs[breadcrumbs.length - 1]?.label || '';
}

interface TopbarProps {
  className?: string;
  actions?: ReactNode;
}

export default function Topbar({ className, actions }: TopbarProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-neutral-200',
        'flex items-center justify-between px-6',
        'sticky top-0 z-30',
        className
      )}
    >
      <div className={cn('flex items-center gap-6 min-w-0 flex-1')}>
        <nav className={cn('flex items-center text-sm')}>
          {breadcrumbs.map((item, index) => (
            <div key={index} className={cn('flex items-center')}>
              {index > 0 && (
                <ChevronRight className={cn('w-4 h-4 mx-2 text-neutral-400')} />
              )}
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
                    index === breadcrumbs.length - 1
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-500'
                  )}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
        <div className={cn('h-6 w-px bg-neutral-200')} />
        <h1 className={cn('text-lg font-semibold text-neutral-900 truncate')}>
          {pageTitle}
        </h1>
        {actions && <div className={cn('ml-4')}>{actions}</div>}
      </div>

      <div className={cn('flex items-center gap-4')}>
        <div
          className={cn(
            'relative',
            'hidden md:block'
          )}
        >
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2',
              'w-4 h-4 text-neutral-400'
            )}
          />
          <input
            type="text"
            placeholder="搜索..."
            className={cn(
              'w-64 h-9 pl-10 pr-4',
              'text-sm text-neutral-900 placeholder:text-neutral-400',
              'bg-neutral-50 border border-neutral-200 rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
        </div>

        <button
          className={cn(
            'relative w-9 h-9 flex items-center justify-center',
            'rounded-md text-neutral-500',
            'hover:bg-neutral-100 hover:text-neutral-700',
            'transition-colors duration-200'
          )}
          aria-label="通知"
        >
          <Bell className="w-5 h-5" />
          <span
            className={cn(
              'absolute top-2 right-2 w-2 h-2',
              'bg-danger-500 rounded-full'
            )}
          />
        </button>

        <div className={cn('h-8 w-px bg-neutral-200')} />

        <button
          className={cn(
            'flex items-center gap-3',
            'rounded-md p-1 pr-3',
            'hover:bg-neutral-100',
            'transition-colors duration-200'
          )}
          aria-label="用户菜单"
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full',
              'bg-primary-50 flex items-center justify-center',
              'text-primary-700'
            )}
          >
            <User className="w-4 h-4" />
          </div>
          <div className={cn('hidden lg:block text-left')}>
            <div className={cn('text-sm font-medium text-neutral-900 leading-tight')}>
              管理员
            </div>
            <div className={cn('text-xs text-neutral-500 leading-tight')}>
              超级管理员
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
