import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  CreditCard,
  Repeat,
  Tags,
  type LucideIcon,
} from 'lucide-react';

export type RouteId =
  | 'dashboard'
  | 'transacoes'
  | 'dividas'
  | 'cartoes'
  | 'contas-fixas'
  | 'categorias';

export interface NavItem {
  id: RouteId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Início', icon: LayoutDashboard, path: '/' },
  { id: 'transacoes', label: 'Transações', shortLabel: 'Trans.', icon: ListChecks, path: '/transacoes' },
  { id: 'dividas', label: 'Dívidas', shortLabel: 'Dívidas', icon: Wallet, path: '/dividas' },
  { id: 'cartoes', label: 'Cartões', shortLabel: 'Cartões', icon: CreditCard, path: '/cartoes' },
  { id: 'contas-fixas', label: 'Contas fixas', shortLabel: 'Fixas', icon: Repeat, path: '/contas-fixas' },
  { id: 'categorias', label: 'Categorias', shortLabel: 'Cat.', icon: Tags, path: '/categorias' },
];

const PATH_TO_ID: Record<string, RouteId> = NAV_ITEMS.reduce(
  (acc, item) => ({ ...acc, [item.path]: item.id }),
  {} as Record<string, RouteId>,
);

const ID_TO_PATH: Record<RouteId, string> = NAV_ITEMS.reduce(
  (acc, item) => ({ ...acc, [item.id]: item.path }),
  {} as Record<RouteId, string>,
);

interface NavigationContextValue {
  current: RouteId;
  navigate: (id: RouteId) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

function pathToRoute(pathname: string): RouteId {
  return PATH_TO_ID[pathname] ?? 'dashboard';
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<RouteId>(() =>
    typeof window !== 'undefined' ? pathToRoute(window.location.pathname) : 'dashboard',
  );

  useEffect(() => {
    const handler = () => setCurrent(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = useCallback((id: RouteId) => {
    const path = ID_TO_PATH[id];
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrent(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  const value = useMemo(() => ({ current, navigate }), [current, navigate]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
