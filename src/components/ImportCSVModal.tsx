import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TransactionFormValues } from '@/types';
import Papa from 'papaparse';
import { showToast } from '@/lib/toast';
import { UploadCloud } from 'lucide-react';


interface ImportCSVModalProps {
  onAddTransactionsBatch: (data: TransactionFormValues[]) => Promise<any>;
  className?: string;
}

export function ImportCSVModal({ onAddTransactionsBatch, className }: ImportCSVModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parseAmount = (val: string): number => {
    if (!val) return 0;
    let cleanStr = val.trim();
    // Se o valor estiver no estilo US "5000.00" ou "-50.50"
    if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
      return parseFloat(cleanStr);
    }
    // Caso seja formato brasileiro "5.000,00" ou "-50,50"
    let cleaned = cleanStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
  };

  const parseDate = (val: string): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (val.includes('/')) {
      const parts = val.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    // Convert DD-MM-YYYY to YYYY-MM-DD
    if (val.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = val.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return val; // Assume it's already YYYY-MM-DD or parse-able by new Date() later validation
  };

  const processImport = async () => {
    if (!file) {
      showToast({ message: 'Selecione um arquivo CSV primeiro.', type: 'error' });
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as Record<string, string>[];
          const transactionsToBatch: TransactionFormValues[] = [];

          for (const row of data) {
            const keys = Object.keys(row);
            const valKey = keys.find(k => k.toLowerCase().includes('valor')) || keys.find(k => k.toLowerCase().includes('amount'));
            const descKey = keys.find(k => k.toLowerCase().includes('descri')) || keys.find(k => k.toLowerCase().includes('historico')) || keys.find(k => k.toLowerCase().includes('detalhe'));
            const dateKey = keys.find(k => k.toLowerCase().includes('data')) || keys.find(k => k.toLowerCase().includes('date'));

            if (!valKey || !descKey || !dateKey) {
              continue;
            }

            const rawAmount = parseAmount(row[valKey]);
            const isIncome = rawAmount > 0;
            const amount = Math.abs(rawAmount);

            if (amount === 0) continue;

            const description = row[descKey]?.trim() || 'Importado via CSV';
            let date = parseDate(row[dateKey]?.trim());
            
            if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
               try {
                   date = new Date().toISOString().split('T')[0];
               } catch (e) {
                   continue;
               }
            }

            transactionsToBatch.push({
              description,
              amount,
              type: isIncome ? 'income' : 'expense',
              category: 'outros',
              date,
              status: 'pago',
            });
          }

          if (transactionsToBatch.length === 0) {
             showToast({ message: 'Nenhuma transação válida encontrada no arquivo', type: 'error' });
             setIsImporting(false);
             return;
          }

          try {
            await onAddTransactionsBatch(transactionsToBatch);
            setOpen(false);
            setFile(null);
            showToast({ message: `${transactionsToBatch.length} transações salvas com sucesso no banco!`, type: 'success' });
          } catch (batchError: any) {
            console.error('Batch Error:', batchError);
            showToast({ message: `Erro ao salvar no banco: ${batchError.message || batchError}`, type: 'error' });
          }
        } catch (error: any) {
          console.error('Parse Error:', error);
          showToast({ message: `Erro na leitura: ${error.message || error}`, type: 'error' });
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('PapaParse error:', error);
        showToast({ message: 'Erro ao ler o arquivo CSV.', type: 'error' });
        setIsImporting(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <UploadCloud className="w-4 h-4 mr-2" />
          <span className="truncate">Importar CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Extrato CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV exportado do seu banco. O sistema tentará
            identificar automaticamente a data, descrição e valor (Despesa e Receita).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              O arquivo deve conter cabeçalho com colunas pararecidas com: "Data", "Descrição", "Valor".
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
            Cancelar
          </Button>
          <Button onClick={processImport} disabled={!file || isImporting}>
            {isImporting ? 'Importando...' : 'Importar transações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
