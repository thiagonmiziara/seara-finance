import { useState } from 'react';
import {
  collection,
  getDocs,
  writeBatch,
  type CollectionReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

/** Tipos de conta existentes — o reset zera TODAS. */
const ACCOUNT_TYPES = ['personal', 'business'] as const;

/** Coleções por conta: users/{uid}/accounts/{accountType}/<nome> */
const ACCOUNT_COLLECTIONS = [
  'transactions',
  'cards',
  'debts',
  'recurringBills',
  'categories',
  'categoryRules',
  'goals',
  'goalContributions',
] as const;

/** Coleções legadas (pré-migração) no nível do usuário: users/{uid}/<nome> */
const LEGACY_COLLECTIONS = ['transactions', 'debts', 'categories'] as const;

const BATCH_LIMIT = 450; // Firestore permite até 500 operações por batch.

async function deleteAllDocs(ref: CollectionReference): Promise<number> {
  const snap = await getDocs(ref);
  let batch = writeBatch(db);
  let inBatch = 0;
  let total = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    inBatch += 1;
    total += 1;
    if (inBatch >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
  return total;
}

export function useResetAccount() {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Apaga TODOS os registros do usuário, nas contas Pessoal E Empresarial,
   * mais as coleções legadas. Mantém apenas o perfil (login). Irreversível.
   */
  const resetAccount = async (): Promise<number> => {
    if (!user) throw new Error('Sessão expirou. Atualize a página.');
    setIsDeleting(true);
    try {
      let total = 0;
      for (const accountType of ACCOUNT_TYPES) {
        for (const name of ACCOUNT_COLLECTIONS) {
          total += await deleteAllDocs(
            collection(db, 'users', user.id, 'accounts', accountType, name),
          );
        }
      }
      // Best-effort: limpa também resíduos das coleções antigas.
      for (const name of LEGACY_COLLECTIONS) {
        total += await deleteAllDocs(collection(db, 'users', user.id, name));
      }
      return total;
    } finally {
      setIsDeleting(false);
    }
  };

  return { resetAccount, isDeleting };
}
