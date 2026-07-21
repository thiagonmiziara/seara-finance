import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/components/layout/navigation';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatBot } from '@/hooks/useChatBot';

/**
 * Página do Assistente — chat-bot estilo WhatsApp que executa operações do
 * app por conversa guiada (botões) ou texto livre. Ver src/lib/chat/ para o
 * motor de fluxos e src/hooks/useChatBot.ts para a orquestração.
 */
export default function AssistantPage() {
  const { navigate } = useNavigation();
  const { messages, footerOptions, isTyping, selectOption, sendText } = useChatBot();

  return (
    <div className='flex flex-col flex-1 min-h-0 bg-muted/30'>
      <header className='shrink-0 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur-md px-3 sm:px-6 h-14'>
        <button
          type='button'
          onClick={() => navigate('dashboard')}
          aria-label='Voltar'
          className='flex h-12 w-12 -ml-2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary'>
          <MessageCircle className='h-5 w-5' />
        </div>
        <div className='flex flex-col leading-tight'>
          <span className='font-semibold text-base'>Assistente Seara</span>
          <span className='text-xs text-muted-foreground'>online</span>
        </div>
      </header>

      <ChatMessageList
        messages={messages}
        isTyping={isTyping}
        onOptionSelect={selectOption}
        optionsDisabled={isTyping}
      />

      <div className='shrink-0 border-t border-border/60 bg-card/95 backdrop-blur-md'>
        <QuickReplies
          options={footerOptions}
          onSelect={selectOption}
          disabled={isTyping}
        />
        <ChatInput onSend={sendText} disabled={isTyping} autoFocus />
      </div>
    </div>
  );
}
