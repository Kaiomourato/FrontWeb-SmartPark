import { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toast = {
    success: (title, msg) => addToast('success', title, msg),
    error:   (title, msg) => addToast('error',   title, msg),
    info:    (title, msg) => addToast('info',     title, msg),
  };

  const icons = { success: 'check', error: 'close', info: 'info' };
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--text-secondary)' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ marginTop: '1px', color: colors[t.type], flexShrink: 0 }}><Icon name={icons[t.type]} size={18} /></span>
            <div>
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-msg">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
