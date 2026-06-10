import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Registro() {
  const [tipo, setTipo] = useState('motorista'); // 'motorista' | 'estacionamento'

  // Campos comuns
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');

  // Campos exclusivos do estacionamento
  const [nomeEstac, setNomeEstac] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [buscandoGeo, setBuscandoGeo] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const buscarLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.error('Não suportado', 'Seu navegador não tem geolocalização.');
      return;
    }
    setBuscandoGeo(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setBuscandoGeo(false);
        toast.success('Localização capturada!', 'Coordenadas preenchidas automaticamente.');
      },
      () => {
        setBuscandoGeo(false);
        toast.error('Sem acesso à localização', 'Preencha as coordenadas manualmente.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha !== confirmar) { toast.error('Senhas não coincidem', ''); return; }
    if (senha.length < 6) { toast.error('Senha fraca', 'Use ao menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      if (tipo === 'motorista') {
        // Cadastro simples de motorista
        await api.post('/auth/register', { email, senha });
        toast.success('Conta criada!', 'Faça login para continuar.');
        navigate('/login');
      } else {
        // 1. Cria o estacionamento
        const estacResp = await api.post('/estacionamentos', {
          nome: nomeEstac,
          endereco,
          valorHora: parseFloat(valorHora),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        });

        // 2. Cria o usuário OPERADOR vinculado ao estacionamento
        await api.post('/auth/register', {
          email,
          senha,
          role: 'OPERADOR',
          estacionamentoId: estacResp.data.id,
        });

        toast.success('Estacionamento cadastrado!', 'Faça login para acessar seu painel.');
        navigate('/login');
      }
    } catch (err) {
      toast.error('Erro ao cadastrar', err.response?.data || 'Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Voltar + Logo */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: 24 }}>
            ← Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div className="sidebar-logo-icon">🅿</div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>SmartPark</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-.5px', marginBottom: 6 }}>Criar conta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>Escolha como deseja usar o SmartPark</p>
        </div>

        {/* Seletor de tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { id: 'motorista',     icon: '🚗', titulo: 'Sou motorista',       sub: 'Quero encontrar e reservar vagas' },
            { id: 'estacionamento', icon: '🅿', titulo: 'Tenho estacionamento', sub: 'Quero gerenciar meu negócio' },
          ].map(op => (
            <button
              key={op.id}
              type="button"
              onClick={() => setTipo(op.id)}
              style={{
                padding: '16px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${tipo === op.id ? 'var(--blue)' : 'var(--border)'}`,
                background: tipo === op.id ? 'var(--blue-glow)' : 'var(--bg-card)',
                transition: 'all .15s',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{op.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '.9rem', color: tipo === op.id ? 'var(--blue-light)' : 'var(--text-primary)', marginBottom: 3 }}>
                {op.titulo}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{op.sub}</div>
            </button>
          ))}
        </div>

        {/* Formulário */}
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Dados do estacionamento — aparecem só para operador */}
            {tipo === 'estacionamento' && (
              <>
                <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
                    Dados do estacionamento
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Nome do estacionamento</label>
                      <input className="form-control" placeholder="Ex: Estacionamento Central"
                        value={nomeEstac} onChange={e => setNomeEstac(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Endereço</label>
                      <input className="form-control" placeholder="Ex: Rua das Flores, 100 — Centro"
                        value={endereco} onChange={e => setEndereco(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Valor por hora padrão (R$)</label>
                      <input className="form-control" type="number" step="0.01" min="0" placeholder="5.00"
                        value={valorHora} onChange={e => setValorHora(e.target.value)} required />
                      <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Você poderá definir preços diferentes por tipo de veículo depois, no painel.
                      </p>
                    </div>

                    {/* Localização */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="form-label" style={{ margin: 0 }}>Localização no mapa</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={buscarLocalizacao} disabled={buscandoGeo}>
                          {buscandoGeo ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Buscando...</> : '📍 Usar minha localização'}
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                          <label className="form-label">Latitude</label>
                          <input className="form-control" type="number" step="any" placeholder="-15.789"
                            value={latitude} onChange={e => setLatitude(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Longitude</label>
                          <input className="form-control" type="number" step="any" placeholder="-47.923"
                            value={longitude} onChange={e => setLongitude(e.target.value)} />
                        </div>
                      </div>
                      <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        A localização permite que motoristas encontrem seu estacionamento no mapa.
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Dados de acesso do operador
                </p>
              </>
            )}

            {/* E-mail e senha — comuns para ambos */}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus={tipo === 'motorista'} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-control" type="password" placeholder="Mínimo 6 caracteres"
                value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input className="form-control" type="password" placeholder="Repita a senha"
                value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
            </div>

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Criando conta...</>
                : tipo === 'motorista' ? 'Criar conta grátis' : 'Cadastrar estacionamento'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--blue-light)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}