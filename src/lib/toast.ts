type ToastOptions = {
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

const CONTAINER_ID = 'seara-toast-container';

function ensureContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.right = '1rem';
    container.style.bottom = '1rem';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(opts: ToastOptions) {
  const container = ensureContainer();
  const {
    message,
    type = 'info',
    duration = 4000,
    actionLabel,
    onAction,
  } = opts;

  const el = document.createElement('div');
  el.className = 'seara-toast';
  el.style.minWidth = '200px';
  el.style.maxWidth = '320px';
  el.style.background =
    type === 'error' ? '#3b0b0b' : type === 'success' ? '#052e16' : '#111827';
  el.style.color = '#fff';
  el.style.padding = '0.75rem 1rem';
  el.style.borderRadius = '0.5rem';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'space-between';
  el.style.gap = '0.75rem';

  const msg = document.createElement('div');
  msg.style.flex = '1';
  msg.style.fontSize = '0.875rem';
  msg.textContent = message;

  el.appendChild(msg);

  if (actionLabel && onAction) {
    const btn = document.createElement('button');
    btn.textContent = actionLabel;
    btn.style.marginLeft = '0.5rem';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.color = '#9AE6B4';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = '600';
    btn.onclick = async (e) => {
      e.stopPropagation();
      try {
        await onAction();
      } catch (e) {
        // ignore
      }
      // remove toast
      if (el.parentNode) el.parentNode.removeChild(el);
    };
    el.appendChild(btn);
  }

  container.appendChild(el);

  const timeout = setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    clearTimeout(timeout);
  }, duration);

  return () => {
    if (el.parentNode) el.parentNode.removeChild(el);
    clearTimeout(timeout);
  };
}
