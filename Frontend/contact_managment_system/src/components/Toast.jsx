import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Toast notifications renderer component supporting accessible live regions and success/error styling.
 *
 * @param {{
 *   toasts?: Array<{ id: number|string, message: string, type: 'success'|'error' }>,
 *   removeToast?: (id: number|string) => void
 * }} props
 * @returns {JSX.Element|null}
 */
export const Toast = ({ toasts = [], removeToast }) => {
  const safeToasts = Array.isArray(toasts) ? toasts.filter(Boolean) : [];

  return (
    <div className="toast-container">
      {safeToasts.map((toast, index) => {
        const toastKey = toast?.id != null ? `toast-${toast.id}` : `toast-idx-${index}`;
        const isError = toast?.type === 'error';
        return (
          <div
            key={toastKey}
            role={isError ? 'alert' : 'status'}
            className={`toast ${isError ? 'toast-error' : 'toast-success'}`}
          >
            {isError ? (
              <AlertCircle size={20} color="var(--danger-color)" />
            ) : (
              <CheckCircle size={20} color="var(--success-color)" />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{toast?.message || ''}</span>
            <button
              aria-label="Dismiss notification"
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
