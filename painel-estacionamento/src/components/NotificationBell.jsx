import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Icon from './Icon';

function tempoRelativo(criadoEm) {
  const ms = Date.now() - new Date(criadoEm).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export default function NotificationBell() {
  const { notificacoes, naoLidas, buscarLista, marcarComoLida, marcarTodasComoLidas } = useNotifications();
  const [aberto, setAberto] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function alternar() {
    const proximo = !aberto;
    setAberto(proximo);
    if (proximo) buscarLista();
  }

  return (
    <div className="notification-wrap" ref={wrapRef}>
      <button
        className="notification-bell"
        onClick={alternar}
        aria-label="Notificações"
        aria-expanded={aberto}
      >
        <Icon name="bell" size={20} />
        {naoLidas > 0 && <span className="notification-badge">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>

      {aberto && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notificações</span>
            {naoLidas > 0 && (
              <button className="notification-mark-all" onClick={marcarTodasComoLidas}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="bell" size={32} /></div>
              <p>Nenhuma notificação por aqui.</p>
            </div>
          ) : (
            notificacoes.map(n => (
              <div
                key={n.id}
                className={`notification-item ${n.lida ? '' : 'unread'}`}
                onClick={() => !n.lida && marcarComoLida(n.id)}
              >
                <div className="notification-item-title">{n.titulo}</div>
                <div className="notification-item-msg">{n.mensagem}</div>
                <div className="notification-item-time">{tempoRelativo(n.criadoEm)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
