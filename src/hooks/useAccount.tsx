import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type AccountType = 'personal' | 'business';

interface AccountRow {
  id: string;
  type: AccountType;
}

interface AccountContextType {
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  accountId: string | null;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const STORAGE_KEY = 'sf:accountType';

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [accountType, setAccountTypeState] = useState<AccountType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'business') return 'business';
    } catch {
      // ignore
    }
    return 'personal';
  });

  const setAccountType = (type: AccountType) => {
    setAccountTypeState(type);
    try {
      localStorage.setItem(STORAGE_KEY, type);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'business' || e.newValue === 'personal') {
          setAccountTypeState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { data: accounts = [], isLoading } = useQuery<AccountRow[]>({
    queryKey: ['accounts', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, type');
      if (error) throw error;
      return (data ?? []) as AccountRow[];
    },
  });

  // ensure the chosen accountType exists for the user; create on demand.
  useEffect(() => {
    if (!user || isLoading) return;
    const exists = accounts.some((a) => a.type === accountType);
    if (exists) return;
    (async () => {
      await supabase.from('accounts').insert({ type: accountType });
    })();
  }, [accountType, accounts, user, isLoading]);

  const accountId = useMemo(() => {
    return accounts.find((a) => a.type === accountType)?.id ?? null;
  }, [accounts, accountType]);

  return (
    <AccountContext.Provider
      value={{ accountType, setAccountType, accountId, isLoading }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
