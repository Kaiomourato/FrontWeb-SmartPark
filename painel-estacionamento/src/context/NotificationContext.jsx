import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const { user } = useAuth();

  const buscarContagem = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notificacoes/nao-lidas/count');
      setNaoLidas(data.total ?? 0);
    } catch {}
  }, [user]);

  const buscarLista = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notificacoes');
      setNotificacoes(data);
    } catch {}
  }, [user]);

  // Contagem via polling leve (roda sempre que logado); a lista completa só é
  // buscada sob demanda, ao abrir o dropdown do sino.
  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      setNaoLidas(0);
      return;
    }
    buscarContagem();
    const t = setInterval(buscarContagem, 25000);
    return () => clearInterval(t);
  }, [user, buscarContagem]);

  const marcarComoLida = useCallback(async (id) => {
    setNotificacoes(prev => prev.map(n => (n.id === id ? { ...n, lida: true } : n)));
    setNaoLidas(prev => Math.max(0, prev - 1));
    try {
      await api.put(`/notificacoes/${id}/lida`);
    } catch {
      buscarContagem();
      buscarLista();
    }
  }, [buscarContagem, buscarLista]);

  const marcarTodasComoLidas = useCallback(async () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await api.put('/notificacoes/lidas');
    } catch {
      buscarContagem();
      buscarLista();
    }
  }, [buscarContagem, buscarLista]);

  return (
    <NotificationContext.Provider
      value={{ notificacoes, naoLidas, buscarLista, marcarComoLida, marcarTodasComoLidas }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
