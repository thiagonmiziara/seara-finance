import { lazy, Suspense } from 'react';
import { useMigration } from '@/hooks/useMigration';
import { useRecurringBillsSync } from '@/hooks/useRecurringBillsSync';
import { DueDebtsReminderModal } from '@/components/DueDebtsReminderModal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NavigationProvider, useNavigation } from './navigation';
import { PeriodProvider } from './period-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AssistantPage = lazy(() => import('@/pages/AssistantPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const DebtsPage = lazy(() => import('@/pages/DebtsPage'));
const CardsPage = lazy(() => import('@/pages/CardsPage'));
const RecurringBillsPage = lazy(() => import('@/pages/RecurringBillsPage'));
const GoalsPage = lazy(() => import('@/pages/GoalsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

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

  // O Assistente controla a própria altura/scroll (chat full-height);
  // as demais páginas usam o container padrão com padding e largura máxima.
  const isChat = current === 'assistente';

  return (
    <div className='min-h-screen bg-background'>
      <DueDebtsReminderModal />
      <div className='flex'>
        <Sidebar />

        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col',
            // No chat, prende a coluna à altura dinâmica do viewport (dvh) para
            // o rodapé com o input ficar sempre visível — inclusive quando o
            // topo tem 2 faixas no mobile (header + seletor de conta) e quando
            // o teclado abre. Demais rotas rolam normalmente (min-h-screen).
            isChat ? 'h-[100dvh] overflow-hidden' : 'min-h-screen',
          )}
        >
          <TopBar />

          <main
            className={cn(
              isChat
                ? 'flex-1 min-h-0 flex flex-col'
                : 'flex-1 px-3 sm:px-6 py-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto',
            )}
          >
            <div
              key={current}
              className={cn(
                isChat
                  ? 'flex-1 flex flex-col min-h-0'
                  : 'animate-in fade-in slide-in-from-bottom-2 duration-300',
              )}
            >
              <Suspense fallback={<PageLoader />}>
                {current === 'dashboard' && <DashboardPage />}
                {current === 'assistente' && <AssistantPage />}
                {current === 'transacoes' && <TransactionsPage />}
                {current === 'dividas' && <DebtsPage />}
                {current === 'cartoes' && <CardsPage />}
                {current === 'contas-fixas' && <RecurringBillsPage />}
                {current === 'objetivos' && <GoalsPage />}
                {current === 'categorias' && <CategoriesPage />}
                {current === 'configuracoes' && <SettingsPage />}
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      {!isChat && <MobileBottomNav />}
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
