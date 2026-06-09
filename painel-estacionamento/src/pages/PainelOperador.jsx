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
      { id: 'dashboard',  icon: '📊', label: 'Dashboard' },
      { id: 'patrio',     icon: '🚗', label: 'Controle de pátio' },
      { id: 'checkin',    icon: '🔍', label: 'Validar check-in' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'historico',     icon: '📋', label: 'Histórico' },
      { id: 'configuracoes', icon: '⚙️', label: 'Configurações' },
    ],
  },
];

function tempoDecorrido(entrada) {
  if (!entrada) return '--';
  const ms = Date.now() - new Date(entrada).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function valorAtual(entrada, valorHora) {
  if (!entrada || !valorHora) return 0;
  return Math.max((Date.now() - new Date(entrada).getTime()) / 3600000, 1) * valorHora;
}

export default function PainelOperador() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [vagas, setVagas] = useState([]);
  const [estadiasAtivas, setEstadiasAtivas] = useState([]);
  const [estacionamento, setEstacionamento] = useState(null);
  const [historico, setHistorico] = useState([]);

  const [placaEntrada, setPlacaEntrada] = useState('');
  const [vagaSelecionada, setVagaSelecionada] = useState('');
  const [codigoCheckin, setCodigoCheckin] = useState('');
  const [codigoNovaVaga, setCodigoNovaVaga] = useState('');
  const [cfgNome, setCfgNome] = useState('');
  const [cfgValorHora, setCfgValorHora] = useState('');
  const [cfgEndereco, setCfgEndereco] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setVagas(v => [...v]), 30000);
    return () => clearInterval(t);
  }, []);

  const carregar = useCallback(async () => {
    try {
      const estacResp = await api.get('/estacionamentos/meu');
      const estac = estacResp.data;
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

  const handleFinalizar = async (id, placa) => {
    if (!window.confirm(`Encerrar estadia da placa ${placa}?`)) return;
    try {
      const { data } = await api.put(`/estadias/${id}/finalizar`);
      toast.success('Estadia encerrada!', `Cobrar R$ ${data.valor?.toFixed(2)} do cliente.`);
      carregar();
    } catch { toast.error('Erro', 'Não foi possível encerrar.'); }
  };

  const handleAddVaga = async (e) => {
    e.preventDefault();
    if (!estacionamento) { toast.error('Sem estacionamento vinculado', ''); return; }
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
    } catch { toast.error('Erro', 'Vaga pode estar ocupada.'); }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    if (!estacionamento) return;
    try {
      await api.put(`/estacionamentos/${estacionamento.id}`, {
        ...estacionamento, nome: cfgNome, valorHora: parseFloat(cfgValorHora), endereco: cfgEndereco,
      });
      toast.success('Configurações salvas!', '');
      carregar();
    } catch { toast.error('Erro ao salvar', ''); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span>Carregando painel...</span>
    </div>
  );

  const vagasLivres  = vagas.filter(v => !v.ocupada && v.ativo !== false).length;
  const vagasOcupadas = vagas.filter(v => v.ocupada).length;
  const faturamentoAberto = estadiasAtivas.reduce((acc, e) => acc + valorAtual(e.entrada, estacionamento?.valorHora), 0);
  const topbarTitles = { dashboard: 'Dashboard', patrio: 'Controle de pátio', checkin: 'Validar check-in', historico: 'Histórico', configuracoes: 'Configurações' };

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
            {[
              { icon: '🚗', label: 'Vagas ocupadas', value: vagasOcupadas, sub: `de ${vagas.length} totais`, color: vagasOcupadas > 0 ? 'var(--blue-light)' : undefined },
              { icon: '🟢', label: 'Vagas livres',   value: vagasLivres,  sub: 'disponíveis agora',  color: 'var(--green)' },
              { icon: '⏱️', label: 'Estadias ativas', value: estadiasAtivas.length, sub: 'em andamento' },
              { icon: '💰', label: 'Faturamento em aberto', value: `R$ ${faturamentoAberto.toFixed(2)}`, sub: 'nas estadias ativas', color: 'var(--green)', small: true },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color, fontSize: s.small ? '1.4rem' : undefined }}>{s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
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
              <div className="vagas-grid">
                {vagas.filter(v => v.ativo !== false).map(v => {
                  const estadia = estadiasAtivas.find(e => e.vaga?.id === v.id);
                  return (
                    <div key={v.id} className={`vaga-tile ${v.ocupada ? 'ocupada' : 'livre'}`}
                      title={estadia ? `${estadia.veiculo?.placa} — ${tempoDecorrido(estadia.entrada)}` : 'Livre'}
                      onClick={() => v.ocupada && setAba('patrio')}>
                      <div className="vaga-tile-icon">{v.ocupada ? '🚗' : '🅿'}</div>
                      <div className="vaga-tile-code" style={{ color: v.ocupada ? 'var(--red)' : 'var(--green)' }}>{v.codigo}</div>
                      {estadia && <div className="vaga-tile-placa">{estadia.veiculo?.placa}</div>}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Registrar entrada manual</h2>
            <form className="entrada-form" onSubmit={handleEntrada}>
              <div className="form-group">
                <label className="form-label">Placa do veículo</label>
                <input className="form-control placa" placeholder="ABC1234"
                  value={placaEntrada} onChange={e => setPlacaEntrada(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alocar na vaga</label>
                <select className="form-control" value={vagaSelecionada} onChange={e => setVagaSelecionada(e.target.value)} required>
                  {vagas.filter(v => v.ativo !== false).length === 0
                    ? <option value="">Nenhuma vaga cadastrada</option>
                    : vagas.filter(v => v.ativo !== false).map(v => (
                      <option key={v.id} value={v.id} disabled={v.ocupada}>
                        Vaga {v.codigo} {v.ocupada ? '⛔ Ocupada' : '✅ Livre'}
                      </option>
                    ))
                  }
                </select>
              </div>
              <button className="btn btn-primary" type="submit">⬆ Liberar cancela</button>
            </form>
          </div>

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
                      <th className="hide-mobile">Tempo</th>
                      <th className="hide-mobile">Valor atual</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadiasAtivas.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td><span className="badge badge-blue">Vaga {est.vaga?.codigo || est.vaga?.id}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>
                          {est.entrada ? new Date(est.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{tempoDecorrido(est.entrada)}</td>
                        <td className="hide-mobile" style={{ color: 'var(--green)', fontWeight: 600 }}>
                          R$ {valorAtual(est.entrada, estacionamento?.valorHora).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleFinalizar(est.id, est.veiculo?.placa)}>
                            Encerrar
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>
                Digite o código que o motorista apresenta no celular para confirmar a entrada.
              </p>
            </div>
            <form onSubmit={handleCheckin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Código de check-in</label>
                <input className="form-control placa"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '6px', height: 58 }}
                  placeholder="XXXXXX" maxLength={8}
                  value={codigoCheckin} onChange={e => setCodigoCheckin(e.target.value.toUpperCase())} required />
              </div>
              <button className="btn btn-primary btn-lg btn-full" type="submit">✓ Confirmar check-in</button>
            </form>
          </div>
          <div className="card" style={{ padding: 18, marginTop: 14, borderLeft: '3px solid var(--amber)' }}>
            <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--amber)' }}>Como funciona:</strong> O motorista reserva uma vaga pelo app → recebe um código → chega no estacionamento → mostra o código → você valida aqui → entrada registrada automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* ══ HISTÓRICO ══ */}
      {aba === 'historico' && (
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
                    <th>Data</th>
                    <th className="hide-mobile">Saída</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(h => (
                    <tr key={h.id}>
                      <td><span className="placa-badge">{h.veiculo?.placa}</span></td>
                      <td><span className="badge badge-gray">Vaga {h.vaga?.codigo || h.vaga?.id}</span></td>
                      <td style={{ fontSize: '.83rem', color: 'var(--text-secondary)' }}>
                        {h.entrada ? new Date(h.entrada).toLocaleDateString('pt-BR') : '--'}
                      </td>
                      <td className="hide-mobile" style={{ fontSize: '.83rem', color: 'var(--text-secondary)' }}>
                        {h.saida ? new Date(h.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--'}
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
      )}

      {/* ══ CONFIGURAÇÕES ══ */}
      {aba === 'configuracoes' && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Dados do estacionamento</h2>
            <form onSubmit={handleSalvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="config-grid">
                <div className="form-group span2">
                  <label className="form-label">Nome</label>
                  <input className="form-control" value={cfgNome} onChange={e => setCfgNome(e.target.value)} required />
                </div>
                <div className="form-group span2">
                  <label className="form-label">Endereço</label>
                  <input className="form-control" value={cfgEndereco} onChange={e => setCfgEndereco(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor por hora (R$)</label>
                  <input className="form-control" type="number" step="0.01" min="0"
                    value={cfgValorHora} onChange={e => setCfgValorHora(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" type="submit">💾 Salvar alterações</button>
              </div>
            </form>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Gerenciar vagas</h2>
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{vagas.length} cadastradas</span>
            </div>
            <form onSubmit={handleAddVaga} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 140px' }}>
                <label className="form-label">Código da nova vaga</label>
                <input className="form-control placa" placeholder="A-01"
                  value={codigoNovaVaga} onChange={e => setCodigoNovaVaga(e.target.value.toUpperCase())} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ height: 44, flexShrink: 0 }}>+ Criar</button>
            </form>
            {vagas.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}><p>Nenhuma vaga cadastrada</p></div>
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
                        <td><span className="placa-badge" style={{ fontSize: '.83rem' }}>{v.codigo}</span></td>
                        <td><span className={`badge ${v.ocupada ? 'badge-red' : 'badge-green'}`}>{v.ocupada ? 'Ocupada' : 'Livre'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVaga(v.id, v.codigo)} disabled={v.ocupada}>Excluir</button>
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

      <style>{`
        .hide-mobile { }
        @media (max-width: 600px) { .hide-mobile { display: none; } }
      `}</style>

    </PainelLayout>
  );
}
