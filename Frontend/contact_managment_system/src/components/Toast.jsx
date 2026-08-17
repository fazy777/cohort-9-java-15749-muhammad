import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const Toast = ({ toasts = [], removeToast }) => {
  const safeToasts = Array.isArray(toasts) ? toasts.filter(Boolean) : [];
  if (safeToasts.length === 0) return null;

  return (
    <div className="toast-container">
      {safeToasts.map((toast, index) => {
        const toastKey = toast?.id != null ? `toast-${toast.id}` : `toast-idx-${index}`;
        return (
          <div
            key={toastKey}
            className={`toast ${toast?.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            {toast?.type === 'success' ? (
              <CheckCircle size={20} color="var(--success-color)" />
            ) : (
              <AlertCircle size={20} color="var(--danger-color)" />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{toast?.message || ''}</span>
            <button
              onClick={() => removeToast?.(toast?.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
