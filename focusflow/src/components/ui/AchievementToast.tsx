import { useEffect } from 'react';
import type { Toast } from '../../types';

interface Props {
  toast: Toast | null;
  onDismiss: () => void;
}

export function AchievementToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite" onClick={onDismiss}>
      <span className="toast-icon">{toast.icon}</span>
      <div>
        <div className="toast-title">{toast.title}</div>
        <div className="toast-desc">{toast.desc}</div>
      </div>
    </div>
  );
}
