import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccountType = 'personal' | 'business';

interface AccountContextType {
    accountType: AccountType;
    setAccountType: (type: AccountType) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
    const [accountType, setAccountTypeState] = useState<AccountType>(() => {
        try {
            const saved = localStorage.getItem('seara:accountType');
            if (saved === 'business') {
                return 'business';
            }
        } catch (e) {
            // ignore
        }
        return 'personal';
    });

    const setAccountType = (type: AccountType) => {
        setAccountTypeState(type);
        try {
            localStorage.setItem('seara:accountType', type);
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'seara:accountType' && e.newValue) {
                if (e.newValue === 'business' || e.newValue === 'personal') {
                    setAccountTypeState(e.newValue);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <AccountContext.Provider value={{ accountType, setAccountType }}>
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
