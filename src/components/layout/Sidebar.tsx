import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation } from './navigation';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { current, navigate } = useNavigation();
  const [collapsed, setCollapsed] = useState(false);

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        'group/sidebar hidden lg:flex flex-col border-r border-border/60 bg-card/80 backdrop-blur-sm transition-[width] duration-200 ease-out sticky top-0 h-screen',
        collapsed ? 'w-[76px]' : 'w-[248px]',
      )}
      aria-label='Navegação principal'
    >
      <div className='flex items-center gap-2 px-4 py-5 border-b border-border/50'>
        <button
          type='button'
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors overflow-hidden',
            'bg-black hover:bg-primary/15 group-hover/sidebar:bg-primary/15',
          )}
        >
          <img
            src='/icone.png'
            alt='Seara Finance'
            className={cn(
              'absolute inset-0 m-auto h-full w-full object-contain transition-opacity duration-200',
              'group-hover/sidebar:opacity-0',
            )}
          />
          <ToggleIcon
            className={cn(
              'absolute h-[18px] w-[18px] text-primary transition-opacity duration-200',
              'opacity-0 group-hover/sidebar:opacity-100',
            )}
            strokeWidth={2.25}
          />
        </button>
        {!collapsed && (
          <div className='flex flex-col leading-tight overflow-hidden'>
            <span className='text-base font-extrabold tracking-tight'>Seara</span>
            <span className='text-[11px] uppercase tracking-widest text-muted-foreground font-semibold'>
              Finance
            </span>
          </div>
        )}
      </div>

      <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide'>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              type='button'
              onClick={() => {
                navigate(item.id);
                onNavigate?.();
              }}
              className={cn(
                'group w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform',
                  isActive ? 'scale-110' : 'group-hover:scale-105',
                )}
              />
              {!collapsed && <span className='truncate'>{item.label}</span>}
              {!collapsed && isActive && (
                <span className='ml-auto h-1.5 w-1.5 rounded-full bg-primary' />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
