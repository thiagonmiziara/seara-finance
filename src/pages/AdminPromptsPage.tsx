import { useMemo, useState } from 'react';
import {
  Brain,
  Image as ImageIcon,
  Lock,
  Save,
  ShieldAlert,
  Sparkles,
  Variable,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/components/layout/navigation';
import {
  useBotPrompts,
  type BotPrompt,
  type UpdatePromptInput,
} from '@/hooks/useBotPrompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const PROMPT_ICON: Record<string, typeof Brain> = {
  intent_parser: Brain,
  receipt_extractor: ImageIcon,
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

interface EditState {
  title: string;
  description: string;
  content: string;
  model: string;
  temperature: string;
  is_active: boolean;
}

function buildEditState(p: BotPrompt): EditState {
  return {
    title: p.title,
    description: p.description ?? '',
    content: p.content,
    model: p.model ?? '',
    temperature: p.temperature == null ? '' : String(p.temperature),
    is_active: p.is_active,
  };
}

export default function AdminPromptsPage() {
  const { user } = useAuth();
  const allowed = isAdminEmail(user?.email);
  const { prompts, loading, error, update } = useBotPrompts();
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.key === selected) ?? null,
    [prompts, selected],
  );

  if (!allowed) {
    return (
      <div className='space-y-4'>
        <div className='rounded-2xl border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center text-center gap-3'>
          <ShieldAlert className='h-10 w-10 text-destructive' />
          <h1 className='text-2xl font-extrabold tracking-tight font-display'>
            Área restrita
          </h1>
          <p className='text-sm text-muted-foreground max-w-md'>
            Esta página é exclusiva para administradores do produto.
            Se você acha que deveria ter acesso, fale com o time.
          </p>
          {user?.email && (
            <p className='text-xs font-mono text-muted-foreground/70 mt-2'>
              Logado como: <span className='text-foreground'>{user.email}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  function openEdit(p: BotPrompt) {
    setSelected(p.key);
    setEdit(buildEditState(p));
  }

  function closeEdit() {
    setSelected(null);
    setEdit(null);
  }

  async function handleSave() {
    if (!selectedPrompt || !edit) return;
    const patch: UpdatePromptInput = {};
    if (edit.title.trim() !== selectedPrompt.title)
      patch.title = edit.title.trim();
    const desc = edit.description.trim() || null;
    if (desc !== (selectedPrompt.description ?? null)) patch.description = desc;
    if (edit.content !== selectedPrompt.content) patch.content = edit.content;
    const newModel = edit.model.trim() || null;
    if (newModel !== (selectedPrompt.model ?? null)) patch.model = newModel;
    const newTemp = edit.temperature.trim() === '' ? null : Number(edit.temperature);
    if (newTemp !== null && (Number.isNaN(newTemp) || newTemp < 0 || newTemp > 2)) {
      showToast({
        message: 'Temperatura precisa ser número entre 0 e 2.',
        type: 'error',
      });
      return;
    }
    if (newTemp !== (selectedPrompt.temperature ?? null))
      patch.temperature = newTemp;
    if (edit.is_active !== selectedPrompt.is_active)
      patch.is_active = edit.is_active;

    if (Object.keys(patch).length === 0) {
      showToast({ message: 'Nada mudou.', type: 'info' });
      return;
    }

    setSaving(true);
    try {
      await update(selectedPrompt.key, patch);
      showToast({ message: 'Prompt atualizado.', type: 'success' });
      closeEdit();
    } catch (e: any) {
      showToast({
        message: `Erro ao salvar: ${e?.message ?? 'desconhecido'}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-primary' />
            <h1 className='text-3xl font-extrabold tracking-tight font-display'>
              Prompts do bot
            </h1>
          </div>
          <p className='text-sm text-muted-foreground mt-1 max-w-2xl'>
            Engenharia de prompt do assistente WhatsApp. Edições salvas aqui
            entram em vigor em até 1 minuto (cache do bot).
            <span className='inline-flex items-center gap-1 ml-2 text-xs font-semibold text-primary'>
              <Lock className='h-3 w-3' /> acesso restrito
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Falha ao carregar prompts: {error}
        </div>
      )}

      {loading ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-40 w-full rounded-2xl' />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground'>
          Nenhum prompt cadastrado. Rode a migration{' '}
          <code className='font-mono text-xs'>0006_bot_prompts.sql</code>.
        </div>
      ) : (
        <ul className='grid gap-4 sm:grid-cols-2'>
          {prompts.map((p) => {
            const Icon = PROMPT_ICON[p.key] ?? Brain;
            return (
              <li
                key={p.key}
                className={cn(
                  'rounded-2xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft',
                  p.is_active
                    ? 'border-border/60'
                    : 'border-border/40 opacity-70',
                )}
              >
                <div className='flex items-start gap-3'>
                  <div className='h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20'>
                    <Icon className='h-5 w-5 text-primary' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h2 className='font-bold truncate'>{p.title}</h2>
                      {!p.is_active && (
                        <span className='text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5'>
                          inativo
                        </span>
                      )}
                    </div>
                    <p className='text-[11px] font-mono text-muted-foreground'>
                      {p.key}
                    </p>
                    {p.description && (
                      <p className='text-sm text-muted-foreground mt-2 line-clamp-2'>
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-3 gap-2 text-[11px]'>
                  <div className='rounded-lg bg-muted/40 px-2 py-1.5'>
                    <div className='uppercase font-bold tracking-wider text-muted-foreground'>
                      versão
                    </div>
                    <div className='font-mono mt-0.5'>v{p.version}</div>
                  </div>
                  <div className='rounded-lg bg-muted/40 px-2 py-1.5'>
                    <div className='uppercase font-bold tracking-wider text-muted-foreground'>
                      temp.
                    </div>
                    <div className='font-mono mt-0.5'>
                      {p.temperature ?? '—'}
                    </div>
                  </div>
                  <div className='rounded-lg bg-muted/40 px-2 py-1.5'>
                    <div className='uppercase font-bold tracking-wider text-muted-foreground'>
                      atualizado
                    </div>
                    <div className='font-mono mt-0.5 truncate'>
                      {fmtDate(p.updated_at)}
                    </div>
                  </div>
                </div>

                {p.variables.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {p.variables.map((v) => (
                      <span
                        key={v.name}
                        className='inline-flex items-center gap-1 text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-mono'
                        title={v.description}
                      >
                        <Variable className='h-3 w-3' />
                        {`{{${v.name}}}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className='mt-4 flex justify-end'>
                  <Button onClick={() => openEdit(p)} size='sm'>
                    Editar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={!!selectedPrompt && !!edit}
        onOpenChange={(o) => !o && closeEdit()}
      >
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          {selectedPrompt && edit && (
            <>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5 text-primary' />
                  {selectedPrompt.title}
                </DialogTitle>
                <p className='text-xs font-mono text-muted-foreground mt-1'>
                  {selectedPrompt.key} • v{selectedPrompt.version}
                </p>
              </DialogHeader>

              <div className='space-y-4 mt-4'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                    Título
                  </label>
                  <Input
                    value={edit.title}
                    onChange={(e) =>
                      setEdit({ ...edit, title: e.target.value })
                    }
                    maxLength={120}
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                    Descrição (apenas para você)
                  </label>
                  <Input
                    value={edit.description}
                    onChange={(e) =>
                      setEdit({ ...edit, description: e.target.value })
                    }
                    placeholder='Quando esse prompt é usado…'
                  />
                </div>

                {selectedPrompt.variables.length > 0 && (
                  <div className='rounded-lg bg-muted/40 border border-border/60 px-3 py-2'>
                    <div className='text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-1'>
                      Variáveis disponíveis
                    </div>
                    <div className='flex flex-wrap gap-2 text-xs'>
                      {selectedPrompt.variables.map((v) => (
                        <div key={v.name} className='font-mono'>
                          <span className='text-primary'>{`{{${v.name}}}`}</span>
                          <span className='text-muted-foreground ml-1'>
                            — {v.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                    Conteúdo
                  </label>
                  <textarea
                    value={edit.content}
                    onChange={(e) =>
                      setEdit({ ...edit, content: e.target.value })
                    }
                    className='w-full min-h-[400px] rounded-lg border border-border/60 bg-background p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/50'
                    spellCheck={false}
                    aria-label='Conteúdo do prompt'
                    placeholder='Conteúdo do prompt em texto livre…'
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Use <code className='font-mono'>{'{{nome}}'}</code> para
                    placeholders. O bot substitui em runtime.
                  </p>
                </div>

                <div className='grid sm:grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                      Modelo (override)
                    </label>
                    <Input
                      value={edit.model}
                      onChange={(e) =>
                        setEdit({ ...edit, model: e.target.value })
                      }
                      placeholder='qwen2.5vl:7b (vazio = padrão)'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                      Temperatura
                    </label>
                    <Input
                      value={edit.temperature}
                      onChange={(e) =>
                        setEdit({ ...edit, temperature: e.target.value })
                      }
                      type='number'
                      min={0}
                      max={2}
                      step={0.05}
                      placeholder='0.20'
                      title='Temperatura do modelo (0 a 2)'
                      aria-label='Temperatura do modelo'
                    />
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <input
                    id='prompt-active'
                    type='checkbox'
                    checked={edit.is_active}
                    onChange={(e) =>
                      setEdit({ ...edit, is_active: e.target.checked })
                    }
                    className='h-4 w-4 rounded border-border accent-primary'
                  />
                  <label
                    htmlFor='prompt-active'
                    className='text-sm font-medium select-none'
                  >
                    Ativo (o bot só usa prompts ativos)
                  </label>
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-4 border-t border-border/40 mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={closeEdit}
                  disabled={saving}
                >
                  <X className='h-4 w-4 mr-1' />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className='h-4 w-4 mr-1' />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
