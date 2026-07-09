import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';

const ROLE_LABEL = { ADMIN: 'Administrador', OPERADOR: 'Operador', USER: 'Motorista' };

export default function PerfilAdmin() {
  const { user, logout } = useAuth();
  const inicial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--grad-dusk)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff',
          }}>
            {inicial}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.email}</div>
            <span className="badge badge-magenta">{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>ID do usuário</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>Permissão</span>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
        </div>

        <button className="btn btn-danger btn-full" style={{ marginTop: 24 }} onClick={logout}>
          <Icon name="close" size={15} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
