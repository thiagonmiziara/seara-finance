/** Bolha "digitando…" do bot — três pontos animados. */
export function TypingBubble() {
  return (
    <div className='flex w-full justify-start anim-msg-in-left' aria-hidden='true'>
      <div className='rounded-2xl rounded-tl-sm px-4 py-3 bg-card border border-border/60 shadow-soft'>
        <span className='flex items-end gap-1 h-3'>
          <span
            className='w-2 h-2 rounded-full bg-muted-foreground/60 anim-typing-dot'
            style={{ animationDelay: '0ms' }}
          />
          <span
            className='w-2 h-2 rounded-full bg-muted-foreground/60 anim-typing-dot'
            style={{ animationDelay: '180ms' }}
          />
          <span
            className='w-2 h-2 rounded-full bg-muted-foreground/60 anim-typing-dot'
            style={{ animationDelay: '360ms' }}
          />
        </span>
      </div>
    </div>
  );
}
