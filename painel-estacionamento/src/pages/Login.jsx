import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { destinoPorRole } from '../utils/destino';
import { useToast } from '../context/ToastContext';
import { getErroMsg } from '../utils/erro';
import Icon from '../components/Icon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const msgRedirect = location.state?.msg;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      login(data);
      toast.success('Login realizado!', `Bem-vindo(a) de volta.`);
      const destino = location.state?.destino || destinoPorRole(data.role);
      navigate(destino, { replace: true });
    } catch (err) {
      toast.error('Falha no login', getErroMsg(err, 'E-mail ou senha incorretos.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>

      {/* Painel esquerdo decorativo */}
      <div style={{
        flex: 1, display: 'none',
        background: 'radial-gradient(circle at 30% 20%, rgba(224,41,155,.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,91,245,.22), transparent 50%), #0a0f1e',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, borderRight: '1px solid var(--border)',
      }} className="login-deco">
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 24px',
            background: 'var(--grad-night)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Icon name="parking" size={36} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.5px' }}>SmartPark</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem' }}>
            Conectando motoristas a estacionamentos em tempo real. Sem filas, sem surpresas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
            {[
              { icon: 'pin', accent: 'var(--violet-light)', label: 'Veja vagas disponíveis em tempo real' },
              { icon: 'ticket', accent: 'var(--magenta-light)', label: 'Reserve e confirme com um código' },
              { icon: 'wallet', accent: 'var(--orange-light)', label: 'Acompanhe o valor da estadia ao vivo' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 10, textAlign: 'left' }}>
                <span style={{ color: f.accent }}><Icon name={f.icon} size={20} /></span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>
              ← Voltar
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>Entrar</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Acesse sua conta SmartPark
            </p>
          </div>

          {msgRedirect && (
            <div style={{ background: 'var(--violet-glow)', border: '1px solid rgba(109,91,245,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '0.875rem', color: 'var(--violet-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bolt" size={15} /> {msgRedirect}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Entrando...</> : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Não tem conta?{' '}
            <Link to="/registro" style={{ color: 'var(--violet-light)', fontWeight: 600 }}>Criar conta</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .login-deco { display: flex !important; } }
      `}</style>
    </div>
  );
}
