import { NavLink } from 'react-router-dom';
import {
  Map,
  ListOrdered,
  ClipboardList,
  SearchCheck,
  CheckCircle2,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const menuItems: MenuItem[] = [
  { to: '/', label: '地图总览', icon: Map },
  { to: '/ledger', label: '病害台账', icon: ListOrdered },
  { to: '/dispatch', label: '工单调度', icon: ClipboardList },
  { to: '/review', label: '现场复核', icon: SearchCheck },
  { to: '/acceptance', label: '维修验收', icon: CheckCircle2 },
  { to: '/reports', label: '统计报表', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-60',
        'bg-neutral-900 text-neutral-100',
        'flex flex-col'
      )}
    >
      <div className={cn('h-16 flex items-center px-6 border-b border-neutral-800')}>
        <div className={cn('flex items-center gap-3')}>
          <div
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center',
              'bg-gradient-to-br from-primary-600 to-primary-800'
            )}
          >
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className={cn('text-base font-semibold tracking-wide')}>道路病害管理</div>
            <div className={cn('text-xs text-neutral-500')}>Road Disease System</div>
          </div>
        </div>
      </div>

      <nav className={cn('flex-1 py-4 overflow-y-auto')}>
        <ul className={cn('space-y-1 px-3')}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium',
                      'transition-all duration-200',
                      'hover:bg-neutral-800 hover:text-white',
                      isActive
                        ? 'bg-primary-800 text-white shadow-sm'
                        : 'text-neutral-300'
                    )
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn('p-4 border-t border-neutral-800')}>
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-md bg-neutral-800/50')}>
          <div className={cn('w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-sm font-medium')}>
            管
          </div>
          <div className={cn('flex-1 min-w-0')}>
            <div className={cn('text-sm font-medium truncate')}>管理员</div>
            <div className={cn('text-xs text-neutral-500 truncate')}>admin@road.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
