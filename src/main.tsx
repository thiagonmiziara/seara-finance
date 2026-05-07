import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import { AccountProvider } from './hooks/useAccount';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { CategoriesProvider } from '@/hooks/useCategories';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AccountProvider>
            <CategoriesProvider>
              <App />
            </CategoriesProvider>
          </AccountProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
