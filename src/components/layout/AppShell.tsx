import { lazy, Suspense } from 'react';
import { useMigration } from '@/hooks/useMigration';
import { useRecurringBillsSync } from '@/hooks/useRecurringBillsSync';
import { WhatsAppOnboardingModal } from '@/components/WhatsAppOnboardingModal';
import { DueDebtsReminderModal } from '@/components/DueDebtsReminderModal';
import { Skeleton } from '@/components/ui/skeleton';
import { NavigationProvider, useNavigation } from './navigation';
import { PeriodProvider } from './period-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const DebtsPage = lazy(() => import('@/pages/DebtsPage'));
const CardsPage = lazy(() => import('@/pages/CardsPage'));
const RecurringBillsPage = lazy(() => import('@/pages/RecurringBillsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const AdminPromptsPage = lazy(() => import('@/pages/AdminPromptsPage'));

function PageLoader() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-64 w-full' />
    </div>
  );
}

function ShellContent() {
  const { current } = useNavigation();
  useMigration();
  useRecurringBillsSync();

  return (
    <div className='min-h-screen bg-background'>
      <WhatsAppOnboardingModal />
      <DueDebtsReminderModal />
      <div className='flex'>
        <Sidebar />

        <div className='flex-1 min-w-0 flex flex-col min-h-screen'>
          <TopBar />

          <main className='flex-1 px-3 sm:px-6 py-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto'>
            <div
              key={current}
              className='animate-in fade-in slide-in-from-bottom-2 duration-300'
            >
              <Suspense fallback={<PageLoader />}>
                {current === 'dashboard' && <DashboardPage />}
                {current === 'transacoes' && <TransactionsPage />}
                {current === 'dividas' && <DebtsPage />}
                {current === 'cartoes' && <CardsPage />}
                {current === 'contas-fixas' && <RecurringBillsPage />}
                {current === 'categorias' && <CategoriesPage />}
                {current === 'billing' && <BillingPage />}
                {current === 'admin-prompts' && <AdminPromptsPage />}
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export function AppShell() {
  return (
    <NavigationProvider>
      <PeriodProvider>
        <ShellContent />
      </PeriodProvider>
    </NavigationProvider>
  );
}
