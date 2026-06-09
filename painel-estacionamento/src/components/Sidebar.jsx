import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ aba, setAba, itens, titulo, subtitulo, open, onClose }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  
  const handleLogout = () => {
    logout();
    toast.info('Sessão encerrada', 'Até logo!');
    navigate('/login');
  };

  const inicial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      {/* Overlay mobile */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">🅿</div>
            <span>SmartPark</span>
          </div>
          {subtitulo && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: 42 }}>
              {subtitulo}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {itens.map((grupo, gi) => (
            <div key={gi}>
              {grupo.label && <div className="sidebar-section-label">{grupo.label}</div>}
              {grupo.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${aba === item.id ? 'active' : ''}`}
                  onClick={() => { setAba(item.id); onClose?.(); }}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{inicial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.email}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-danger btn-full btn-sm" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
