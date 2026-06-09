import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PainelLayout from '../components/PainelLayout';

const NAV = [
  {
    label: 'Operação',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'patrio',    icon: '🚗', label: 'Controle de pátio' },
      { id: 'checkin',   icon: '🔍', label: 'Validar check-in' },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { id: 'historico',     icon: '📋', label: 'Histórico' },
      { id: 'configuracoes', icon: '⚙️', label: 'Configurações' },
    ]
  }
];

/* ── Utilitário de tempo ── */
function tempoDecorrido(entrada) {
  if (!entrada) return '--';
  const ms = Date.now() - new Date(entrada).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function valorAtual(entrada, valorHora) {
  if (!entrada || !valorHora) return 0;
  const horas = (Date.now() - new Date(entrada).getTime()) / 3600000;
  return Math.max(horas, 1) * valorHora;
}

export default function PainelOperador() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [vagas, setVagas] = useState([]);
  const [estadiasAtivas, setEstadiasAtivas] = useState([]);
  const [estacionamento, setEstacionamento] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [tick, setTick] = useState(0);

  // Formulários
  const [placaEntrada, setPlacaEntrada] = useState('');
  const [vagaSelecionada, setVagaSelecionada] = useState('');
  const [codigoCheckin, setCodigoCheckin] = useState('');
  const [codigoNovaVaga, setCodigoNovaVaga] = useState('');
  const [cfgNome, setCfgNome] = useState('');
  const [cfgValorHora, setCfgValorHora] = useState('');
  const [cfgEndereco, setCfgEndereco] = useState('');

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Atualiza tempo a cada 30s
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const carregar = useCallback(async () => {
    try {
      const estacResp = await api.get('/estacionamentos/meu');
      const estac = estacResp.data; // objeto único, não array
      setEstacionamento(estac);
      setCfgNome(estac.nome || '');
      setCfgValorHora(estac.valorHora || '');
      setCfgEndereco(estac.endereco || '');

      const [vagasR, estadiasR] = await Promise.all([
        api.get('/vagas'),
        api.get('/estadias/ativas'),
      ]);
      setVagas(vagasR.data);
      setEstadiasAtivas(estadiasR.data);
      if (vagasR.data.length > 0 && !vagaSelecionada) {
        const livre = vagasR.data.find(v => !v.ocupada);
        setVagaSelecionada(livre?.id || vagasR.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await api.get('/estadias/historico');
      setHistorico(r.data);
    } catch { setHistorico([]); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (aba === 'historico') carregarHistorico(); }, [aba, carregarHistorico]);

  /* ── Ações ── */
  const handleEntrada = async (e) => {
    e.preventDefault();
    if (!vagaSelecionada) { toast.error('Selecione uma vaga', ''); return; }
    try {
      await api.post(`/estadias?placa=${placaEntrada.toUpperCase()}&vagaId=${vagaSelecionada}`);
      toast.success('Entrada registrada!', `Placa ${placaEntrada.toUpperCase()} alocada.`);
      setPlacaEntrada('');
      carregar();
    } catch (err) {
      toast.error('Erro', err.response?.data?.message || 'Veículo não encontrado ou vaga ocupada.');
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/estadias/checkin?codigo=${codigoCheckin.toUpperCase()}`);
      toast.success('Check-in confirmado!', 'Veículo vinculado à vaga.');
      setCodigoCheckin('');
      carregar();
    } catch (err) {
      toast.error('Código inválido', err.response?.data?.message || 'Código não encontrado ou expirado.');
    }
  };

  const handleFinalizar = async (idEstadia, placa) => {
    if (!window.confirm(`Encerrar estadia da placa ${placa}?`)) return;
    try {
      const { data } = await api.put(`/estadias/${idEstadia}/finalizar`);
      toast.success('Estadia encerrada!', `Cobrar R$ ${data.valor?.toFixed(2)} do cliente.`);
      carregar();
    } catch (err) {
      toast.error('Erro', 'Não foi possível encerrar a estadia.');
    }
  };

  const handleAddVaga = async (e) => {
    e.preventDefault();
    if (!estacionamento) { toast.error('Sem estacionamento', ''); return; }
    try {
      await api.post('/vagas', { codigo: codigoNovaVaga, ocupada: false, estacionamento: { id: estacionamento.id } });
      toast.success('Vaga criada!', `Vaga ${codigoNovaVaga} adicionada.`);
      setCodigoNovaVaga('');
      carregar();
    } catch (err) {
      toast.error('Erro', err.response?.data?.message || 'Código pode já existir.');
    }
  };

  const handleDeleteVaga = async (id, codigo) => {
    if (!window.confirm(`Excluir vaga ${codigo}?`)) return;
    try {
      await api.delete(`/vagas/${id}`);
      toast.success('Vaga removida', `Vaga ${codigo} excluída.`);
      carregar();
    } catch (err) {
      toast.error('Erro', 'Vaga pode estar ocupada.');
    }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    if (!estacionamento) return;
    try {
      await api.put(`/estacionamentos/${estacionamento.id}`, {
        ...estacionamento, nome: cfgNome, valorHora: parseFloat(cfgValorHora), endereco: cfgEndereco
      });
      toast.success('Configurações salvas!', '');
      carregar();
    } catch {
      toast.error('Erro ao salvar', '');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span>Carregando painel...</span>
    </div>
  );

  const vagasLivres = vagas.filter(v => !v.ocupada && v.ativo !== false).length;
  const vagasOcupadas = vagas.filter(v => v.ocupada).length;
  const faturamentoDia = estadiasAtivas.reduce((acc, e) => {
    return acc + valorAtual(e.entrada, estacionamento?.valorHora);
  }, 0);

  const topbarTitles = {
    dashboard: 'Dashboard', patrio: 'Controle de pátio',
    checkin: 'Validar check-in', historico: 'Histórico', configuracoes: 'Configurações',
  };

  return (
    <PainelLayout
      aba={aba} setAba={setAba} itens={NAV}
      subtitulo={estacionamento?.nome || 'Operador'}
      topbarTitle={topbarTitles[aba]}
      topbarSub={aba === 'patrio' ? `${estadiasAtivas.length} veículo(s) no pátio` : undefined}
    >

      {/* ══ DASHBOARD ══ */}
      {aba === 'dashboard' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">🚗</div>
              <div className="stat-card-label">Vagas ocupadas</div>
              <div className="stat-card-value" style={{ color: vagasOcupadas > 0 ? 'var(--blue-light)' : 'var(--text-primary)' }}>{vagasOcupadas}</div>
              <div className="stat-card-sub">de {vagas.length} vagas totais</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🟢</div>
              <div className="stat-card-label">Vagas livres</div>
              <div className="stat-card-value" style={{ color: 'var(--green)' }}>{vagasLivres}</div>
              <div className="stat-card-sub">disponíveis agora</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">⏱️</div>
              <div className="stat-card-label">Estadias ativas</div>
              <div className="stat-card-value">{estadiasAtivas.length}</div>
              <div className="stat-card-sub">em andamento</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">💰</div>
              <div className="stat-card-label">Faturamento em aberto</div>
              <div className="stat-card-value" style={{ color: 'var(--green)', fontSize: '1.5rem' }}>
                R$ {faturamentoDia.toFixed(2)}
              </div>
              <div className="stat-card-sub">nas estadias ativas</div>
            </div>
          </div>

          {/* Pátio em tempo real */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Pátio em tempo real</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setAba('patrio')}>Ver controle →</button>
            </div>
            {vagas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🅿</div>
                <h3>Nenhuma vaga cadastrada</h3>
                <p>Vá em Configurações para adicionar vagas</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                {vagas.filter(v => v.ativo !== false).map(v => {
                  const estadia = estadiasAtivas.find(e => e.vaga?.id === v.id);
                  return (
                    <div key={v.id} style={{
                      border: `2px solid ${v.ocupada ? 'var(--red)' : 'var(--green)'}`,
                      borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                      background: v.ocupada ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                      cursor: v.ocupada ? 'pointer' : 'default',
                    }}
                      title={estadia ? `${estadia.veiculo?.placa} — ${tempoDecorrido(estadia.entrada)}` : 'Livre'}
                      onClick={() => v.ocupada && estadia && setAba('patrio')}
                    >
                      <div style={{ fontSize: '1.2rem' }}>{v.ocupada ? '🚗' : '🅿'}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: 4, color: v.ocupada ? 'var(--red)' : 'var(--green)' }}>{v.codigo}</div>
                      {estadia && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{estadia.veiculo?.placa}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ CONTROLE DE PÁTIO ══ */}
      {aba === 'patrio' && (
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr' }}>
          {/* Registrar entrada manual */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Registrar entrada manual</h2>
            <form onSubmit={handleEntrada} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: '1 1 180px' }}>
                <label className="form-label">Placa do veículo</label>
                <input className="form-control placa" placeholder="ABC1234"
                  value={placaEntrada} onChange={e => setPlacaEntrada(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: '1 1 180px' }}>
                <label className="form-label">Alocar na vaga</label>
                <select className="form-control" value={vagaSelecionada} onChange={e => setVagaSelecionada(e.target.value)} required>
                  {vagas.filter(v => !v.ocupada && v.ativo !== false).length === 0
                    ? <option value="">Nenhuma vaga livre</option>
                    : vagas.filter(v => v.ativo !== false).map(v => (
                      <option key={v.id} value={v.id} disabled={v.ocupada}>
                        Vaga {v.codigo} {v.ocupada ? '⛔' : '✅'}
                      </option>
                    ))
                  }
                </select>
              </div>
              <button className="btn btn-primary" type="submit" style={{ height: 44 }}>
                ⬆ Liberar cancela
              </button>
            </form>
          </div>

          {/* Veículos no pátio */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>
              Veículos no pátio — {estadiasAtivas.length} {estadiasAtivas.length === 1 ? 'ativo' : 'ativos'}
            </h2>
            {estadiasAtivas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏁</div>
                <h3>Pátio vazio</h3>
                <p>Nenhum veículo registrado no momento</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Vaga</th>
                      <th>Entrada</th>
                      <th>Tempo</th>
                      <th>Valor atual</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadiasAtivas.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td><span className="badge badge-blue">Vaga {est.vaga?.codigo || est.vaga?.id}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {est.entrada ? new Date(est.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{tempoDecorrido(est.entrada)}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                          R$ {valorAtual(est.entrada, estacionamento?.valorHora).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-success btn-sm"
                            onClick={() => handleFinalizar(est.id, est.veiculo?.placa)}>
                            Encerrar & Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VALIDAR CHECK-IN ══ */}
      {aba === 'checkin' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
              <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Validar código do motorista</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                O motorista que fez uma reserva verá um código único no app dele.
                Digite ou escaneie esse código para confirmar a entrada.
              </p>
            </div>
            <form onSubmit={handleCheckin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Código de check-in</label>
                <input
                  className="form-control placa"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '6px', height: 56 }}
                  placeholder="XXXXXX"
                  maxLength={8}
                  value={codigoCheckin}
                  onChange={e => setCodigoCheckin(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <button className="btn btn-primary btn-lg btn-full" type="submit">
                ✓ Confirmar check-in
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: 20, marginTop: 16, borderLeft: '3px solid var(--amber)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--amber)' }}>Como funciona:</strong> O motorista reserva uma vaga pelo app → recebe um código → chega no estacionamento → mostra o código para você → você valida aqui e a entrada é registrada automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* ══ HISTÓRICO ══ */}
      {aba === 'historico' && (
        <div>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Estadias encerradas</h2>
            {historico.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Sem histórico ainda</h3>
                <p>As estadias encerradas aparecerão aqui</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Vaga</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th style={{ textAlign: 'right' }}>Valor cobrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map(h => (
                      <tr key={h.id}>
                        <td><span className="placa-badge">{h.veiculo?.placa}</span></td>
                        <td><span className="badge badge-gray">Vaga {h.vaga?.codigo || h.vaga?.id}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {h.entrada ? new Date(h.entrada).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '--'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {h.saida ? new Date(h.saida).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '--'}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>
                          R$ {h.valor?.toFixed(2) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ CONFIGURAÇÕES ══ */}
      {aba === 'configuracoes' && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Dados gerais */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Dados do estacionamento</h2>
            <form onSubmit={handleSalvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-control" value={cfgNome} onChange={e => setCfgNome(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-control" value={cfgEndereco} onChange={e => setCfgEndereco(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor por hora (R$)</label>
                <input className="form-control" type="number" step="0.01" min="0"
                  value={cfgValorHora} onChange={e => setCfgValorHora(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" type="submit">💾 Salvar alterações</button>
              </div>
            </form>
          </div>

          {/* Gerenciar vagas */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Gerenciar vagas</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{vagas.length} cadastradas</span>
            </div>

            <form onSubmit={handleAddVaga} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Código da nova vaga</label>
                <input className="form-control placa" placeholder="A-01"
                  value={codigoNovaVaga} onChange={e => setCodigoNovaVaga(e.target.value.toUpperCase())} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ height: 44 }}>+ Criar</button>
            </form>

            {vagas.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>Nenhuma vaga cadastrada</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vagas.map(v => (
                      <tr key={v.id}>
                        <td><span className="placa-badge" style={{ fontSize: '0.85rem' }}>{v.codigo}</span></td>
                        <td>
                          <span className={`badge ${v.ocupada ? 'badge-red' : 'badge-green'}`}>
                            {v.ocupada ? 'Ocupada' : 'Livre'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteVaga(v.id, v.codigo)}
                            disabled={v.ocupada}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </PainelLayout>
  );
}
