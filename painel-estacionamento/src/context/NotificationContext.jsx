import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { obterTokenPushSeConcedido, solicitarPermissaoEToken, ouvirMensagensEmPrimeiroPlano } from '../firebase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [permissaoPush, setPermissaoPush] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const { user } = useAuth();
  const toast = useToast();

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

  const registrarToken = useCallback(async (token) => {
    if (!token) return;
    try {
      await api.post('/notificacoes/dispositivo', { token });
    } catch {}
  }, []);

  // Se o navegador já tinha permissão concedida (de um login anterior), renova/realoca
  // o token para o usuário atual sem exibir o prompt de novo — cobre o caso de dois
  // usuários diferentes logando no mesmo navegador/dispositivo.
  useEffect(() => {
    if (!user || permissaoPush !== 'granted') return;
    obterTokenPushSeConcedido().then(registrarToken).catch(() => {});
  }, [user, permissaoPush, registrarToken]);

  // Notificação chegando com a aba aberta: o navegador não mostra sozinho, então
  // usamos o toast já existente e atualizamos a contagem/lista na hora.
  useEffect(() => {
    ouvirMensagensEmPrimeiroPlano((payload) => {
      const { title, body } = payload.notification || {};
      toast.info(title || 'Nova notificação', body);
      buscarContagem();
      buscarLista();
    });
  }, [toast, buscarContagem, buscarLista]);

  const ativarPush = useCallback(async () => {
    try {
      const token = await solicitarPermissaoEToken();
      setPermissaoPush(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
      if (token) await registrarToken(token);
      return !!token;
    } catch {
      return false;
    }
  }, [registrarToken]);

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
      value={{ notificacoes, naoLidas, buscarLista, marcarComoLida, marcarTodasComoLidas, permissaoPush, ativarPush }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
