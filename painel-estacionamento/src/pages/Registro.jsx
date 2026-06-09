import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Registro() {
  const [form, setForm] = useState({ email: '', senha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.senha !== form.confirmar) {
      toast.error('Senhas não coincidem', 'Digite a mesma senha nos dois campos.');
      return;
    }
    if (form.senha.length < 6) {
      toast.error('Senha fraca', 'Use ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { email: form.email, senha: form.senha });
      toast.success('Conta criada!', 'Faça login para continuar.');
      navigate('/login');
    } catch (err) {
      toast.error('Erro ao criar conta', err.response?.data || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>
            ← Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🅿</div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>SmartPark</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>Criar conta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Cadastre-se como motorista para reservar vagas
          </p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" placeholder="seu@email.com"
                value={form.email} onChange={set('email')} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-control" type="password" placeholder="Mínimo 6 caracteres"
                value={form.senha} onChange={set('senha')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input className="form-control" type="password" placeholder="Repita a senha"
                value={form.confirmar} onChange={set('confirmar')} required />
            </div>
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Criando conta...</> : 'Criar conta grátis'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--blue-light)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
