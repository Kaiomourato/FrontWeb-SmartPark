import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErroMsg } from '../utils/erro';
import PainelLayout from '../components/PainelLayout';
import BarChart from '../components/BarChart';
import ModalConfirm from '../components/ModalConfirm';
import Icon from '../components/Icon';

const NAV = [
  {
    label: 'Operação',
    items: [
      { id: 'dashboard',  icon: <Icon name="gauge" size={18} />,    label: 'Dashboard' },
      { id: 'patrio',     icon: <Icon name="car" size={18} />,      label: 'Controle de pátio' },
      { id: 'checkin',    icon: <Icon name="search" size={18} />,   label: 'Validar check-in' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'vagas',         icon: <Icon name="parking" size={18} />,  label: 'Gerenciar vagas' },
      { id: 'agendadas',     icon: <Icon name="calendar" size={18} />, label: 'Vagas agendadas' },
      { id: 'historico',     icon: <Icon name="list" size={18} />,     label: 'Histórico' },
      { id: 'configuracoes', icon: <Icon name="gear" size={18} />,     label: 'Configurações' },
    ],
  },
];

const TIPOS_VEICULO = [
  { id: 'CARRO', icon: 'car', label: 'Carro' },
  { id: 'MOTO', icon: 'moto', label: 'Moto' },
  { id: 'CAMINHONETE', icon: 'truck', label: 'Caminhonete' },
];

function tipoInfo(tipoVeiculo) {
  return TIPOS_VEICULO.find(t => t.id === tipoVeiculo) || { icon: 'parking', label: 'Qualquer tipo' };
}

function tempoDecorrido(entrada) {
  if (!entrada) return '--';
  const ms = Date.now() - new Date(entrada).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// Classifica o tempo de permanência para destacar vagas que estão "girando"
// devagar — sinal visual de prioridade para o operador no pátio.
function classeTempo(entrada) {
  if (!entrada) return '';
  const horas = (Date.now() - new Date(entrada).getTime()) / 3600000;
  if (horas >= 2) return 'tempo-muito-alto';
  if (horas >= 1) return 'tempo-alto';
  return '';
}

function formatarDataHora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
  const [tipoNovaVaga, setTipoNovaVaga] = useState('');
  const [cfgNome, setCfgNome] = useState('');
  const [cfgValorHora, setCfgValorHora] = useState('');
  const [cfgEndereco, setCfgEndereco] = useState('');

  const [resumoVagas, setResumoVagas] = useState([]);
  const [vagaEditando, setVagaEditando] = useState(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editTipo, setEditTipo] = useState('');

  const [precos, setPrecos] = useState({ CARRO: '', MOTO: '', CAMINHONETE: '' });
  const [salvandoPrecos, setSalvandoPrecos] = useState(false);

  const [enviandoEntrada, setEnviandoEntrada] = useState(false);
  const [enviandoCheckin, setEnviandoCheckin] = useState(false);
  const [processandoEstadiaId, setProcessandoEstadiaId] = useState(null);

  const [relatorio, setRelatorio] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const toast = useToast();
  const checkinInputRef = useRef(null);

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
    } catch (err) {
      console.error(err);
    }

    // Chamadas independentes: uma falhar não pode impedir a outra de ser exibida.
    const [vagasR, estadiasR] = await Promise.allSettled([
      api.get('/vagas'),
      api.get('/estadias/ativas'),
    ]);
    if (vagasR.status === 'fulfilled') setVagas(vagasR.value.data);
    else console.error(vagasR.reason);
    if (estadiasR.status === 'fulfilled') setEstadiasAtivas(estadiasR.value.data);
    else console.error(estadiasR.reason);

    setLoading(false);
  }, []);

  const carregarResumoVagas = useCallback(async () => {
    try {
      const { data } = await api.get('/vagas/resumo');
      setResumoVagas(data);
    } catch { setResumoVagas([]); }
  }, []);

  const carregarPrecos = useCallback(async () => {
    try {
      const { data } = await api.get('/estacionamentos/meu/precos');
      setPrecos(p => {
        const novo = { ...p };
        TIPOS_VEICULO.forEach(t => { novo[t.id] = ''; });
        data.forEach(item => { novo[item.tipoVeiculo] = item.valorHora ?? ''; });
        return novo;
      });
    } catch { /* mantém valores padrão */ }
  }, []);

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await api.get('/estadias/historico');
      setHistorico(r.data);
    } catch { setHistorico([]); }
  }, []);

  const carregarRelatorio = useCallback(async () => {
    try {
      const { data } = await api.get('/estacionamentos/meu/relatorio');
      setRelatorio(data);
    } catch { setRelatorio(null); }
  }, []);

  useEffect(() => { carregar(); carregarResumoVagas(); carregarPrecos(); carregarRelatorio(); }, [carregar, carregarResumoVagas, carregarPrecos, carregarRelatorio]);
  useEffect(() => { if (aba === 'historico') carregarHistorico(); }, [aba, carregarHistorico]);

  // Vaga efetivamente selecionada no formulário de entrada: cai sempre numa
  // vaga livre válida, mesmo que a seleção anterior tenha ficado ocupada.
  const vagasLivresPatio = vagas.filter(v => !v.ocupada && v.ativo !== false);
  const vagaSelecionadaValida = vagasLivresPatio.some(v => String(v.id) === String(vagaSelecionada));
  const vagaAtual = vagaSelecionadaValida ? vagaSelecionada : String(vagasLivresPatio[0]?.id ?? '');

  const handleEntrada = async (e) => {
    e.preventDefault();
    if (!vagaAtual) { toast.error('Nenhuma vaga livre', 'O pátio está lotado no momento.'); return; }
    if (!placaEntrada.trim()) { toast.error('Informe a placa', ''); return; }
    setEnviandoEntrada(true);
    try {
      await api.post('/estadias', null, { params: { placa: placaEntrada.toUpperCase(), vagaId: vagaAtual } });
      toast.success('Entrada registrada!', `Placa ${placaEntrada.toUpperCase()} alocada.`);
      setPlacaEntrada('');
      carregar();
    } catch (err) {
      toast.error('Erro', getErroMsg(err, 'Veículo não encontrado ou vaga ocupada.'));
    } finally {
      setEnviandoEntrada(false);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (enviandoCheckin) return;
    setEnviandoCheckin(true);
    try {
      await api.put('/estadias/checkin', null, { params: { codigo: codigoCheckin.toUpperCase() } });
      // Vibração curta de confirmação — feedback sensorial pro operador, que
      // geralmente está de olho no carro/fila e não na tela.
      navigator.vibrate?.(80);
      toast.success('Check-in confirmado!', 'Entrada registrada com sucesso.');
      setCodigoCheckin('');
      carregar();
    } catch (err) {
      navigator.vibrate?.([60, 50, 60]);
      toast.error('Código inválido', getErroMsg(err, 'Código não encontrado ou expirado.'));
      checkinInputRef.current?.select();
    } finally {
      setEnviandoCheckin(false);
    }
  };

  // "Modo cancela": ao digitar um código de 6 caracteres, confirma automaticamente
  // — ganha 1-2s por veículo, relevante em horário de pico.
  useEffect(() => {
    if (codigoCheckin.length === 6 && !enviandoCheckin) {
      handleCheckin({ preventDefault: () => {} });
    }
  }, [codigoCheckin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinalizar = async (id) => {
    setProcessandoEstadiaId(id);
    try {
      const { data } = await api.put(`/estadias/${id}/finalizar`);
      toast.success('Estadia encerrada!', `Cobrar R$ ${data.valor?.toFixed(2)} do cliente.`);
      carregar();
    } catch { toast.error('Erro', 'Não foi possível encerrar.'); } finally {
      setProcessandoEstadiaId(null);
    }
  };

  const confirmarFinalizar = (id, placa) => {
    setConfirmacao({
      titulo: 'Encerrar estadia',
      mensagem: `Encerrar a estadia da placa ${placa}? O valor final será calculado no momento da confirmação.`,
      corConfirmar: 'success',
      textoConfirmar: 'Encerrar',
      onConfirmar: () => { setConfirmacao(null); handleFinalizar(id); },
    });
  };

  const handleCancelarReserva = async (id) => {
    setProcessandoEstadiaId(id);
    try {
      await api.put(`/estadias/${id}/cancelar`);
      toast.success('Reserva cancelada', 'O motorista foi notificado.');
      carregar();
    } catch (err) {
      toast.error('Erro', getErroMsg(err, 'Não foi possível cancelar a reserva.'));
    } finally {
      setProcessandoEstadiaId(null);
    }
  };

  const confirmarCancelarReserva = (id, placa) => {
    setConfirmacao({
      titulo: 'Cancelar reserva',
      mensagem: `Cancelar a reserva de ${placa || 'este veículo'}? O motorista será notificado.`,
      corConfirmar: 'danger',
      textoConfirmar: 'Cancelar reserva',
      onConfirmar: () => { setConfirmacao(null); handleCancelarReserva(id); },
    });
  };

  const handleAddVaga = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vagas', { codigo: codigoNovaVaga, tipoVeiculo: tipoNovaVaga || null });
      toast.success('Vaga criada!', `Vaga ${codigoNovaVaga} adicionada.`);
      setCodigoNovaVaga('');
      setTipoNovaVaga('');
      carregar();
      carregarResumoVagas();
    } catch (err) {
      toast.error('Erro', getErroMsg(err, 'Código pode já existir.'));
    }
  };

  const handleDeleteVaga = async (id, codigo) => {
    try {
      await api.delete(`/vagas/${id}`);
      toast.success('Vaga removida', `Vaga ${codigo} excluída.`);
      carregar();
      carregarResumoVagas();
    } catch { toast.error('Erro', 'Vaga pode estar ocupada.'); }
  };

  const confirmarDeleteVaga = (id, codigo) => {
    setConfirmacao({
      titulo: 'Excluir vaga',
      mensagem: `Excluir a vaga ${codigo}? Essa ação não pode ser desfeita.`,
      corConfirmar: 'danger',
      textoConfirmar: 'Excluir',
      onConfirmar: () => { setConfirmacao(null); handleDeleteVaga(id, codigo); },
    });
  };

  const iniciarEdicaoVaga = (vaga) => {
    setVagaEditando(vaga.id);
    setEditCodigo(vaga.codigo);
    setEditTipo(vaga.tipoVeiculo || '');
  };

  const cancelarEdicaoVaga = () => {
    setVagaEditando(null);
    setEditCodigo('');
    setEditTipo('');
  };

  const handleSalvarVaga = async (id) => {
    if (!editCodigo.trim()) { toast.error('Código obrigatório', ''); return; }
    const vaga = vagas.find(v => v.id === id);
    try {
      await api.put(`/vagas/${id}`, { codigo: editCodigo.toUpperCase(), tipoVeiculo: editTipo || null, ativo: vaga?.ativo !== false });
      toast.success('Vaga atualizada!', '');
      cancelarEdicaoVaga();
      carregar();
      carregarResumoVagas();
    } catch (err) {
      toast.error('Erro', getErroMsg(err, 'Não foi possível atualizar a vaga.'));
    }
  };

  const handleToggleAtivo = async (vaga) => {
    const novoAtivo = vaga.ativo === false;
    try {
      await api.put(`/vagas/${vaga.id}`, { codigo: vaga.codigo, tipoVeiculo: vaga.tipoVeiculo || null, ativo: novoAtivo });
      toast.success(novoAtivo ? 'Vaga ativada!' : 'Vaga desativada', `Vaga ${vaga.codigo}`);
      carregar();
      carregarResumoVagas();
    } catch {
      toast.error('Erro', 'Não foi possível atualizar a vaga.');
    }
  };

  const handleSalvarPrecos = async (e) => {
    e.preventDefault();
    const itens = TIPOS_VEICULO
      .filter(t => precos[t.id] !== '' && precos[t.id] !== null && precos[t.id] !== undefined)
      .map(t => ({ tipoVeiculo: t.id, valorHora: parseFloat(String(precos[t.id]).replace(',', '.')) }));

    if (itens.length === 0) {
      toast.info('Nada para salvar', 'Defina ao menos um valor personalizado, ou deixe em branco para usar o padrão.');
      return;
    }

    setSalvandoPrecos(true);
    try {
      await api.put('/estacionamentos/meu/precos', itens);
      toast.success('Preços salvos!', '');
      carregarPrecos();
    } catch (err) {
      toast.error('Erro ao salvar preços', getErroMsg(err, 'Não foi possível salvar os preços.'));
    } finally {
      setSalvandoPrecos(false);
    }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    if (!estacionamento) return;
    try {
      await api.put(`/estacionamentos/${estacionamento.id}`, {
        ...estacionamento, nome: cfgNome, valorHora: parseFloat(String(cfgValorHora).replace(',', '.')), endereco: cfgEndereco,
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

  const vagasLivres  = vagasLivresPatio.length;
  const vagasOcupadas = vagas.filter(v => v.ocupada).length;
  const faturamentoAberto = estadiasAtivas.reduce((acc, e) => acc + valorAtual(e.entrada, estacionamento?.valorHora), 0);
  const reservasPendentes = estadiasAtivas.filter(e => e.pendente);
  const topbarTitles = { dashboard: 'Dashboard', patrio: 'Controle de pátio', vagas: 'Gerenciar vagas', agendadas: 'Vagas agendadas', checkin: 'Validar check-in', historico: 'Histórico', configuracoes: 'Configurações' };

  return (
    <PainelLayout
      aba={aba} setAba={setAba} itens={NAV}
      subtitulo={estacionamento?.nome || 'Operador'}
      topbarTitle={topbarTitles[aba]}
      topbarSub={aba === 'patrio' ? `${estadiasAtivas.length} veículo(s) no pátio` : undefined}
    >

      {/* ══ DASHBOARD ══ */}
      {aba === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="stats-grid">
            {[
              { icon: 'car',      acc: 'acc-magenta', label: 'Vagas ocupadas', value: vagasOcupadas, sub: `de ${vagas.length} totais`, color: vagasOcupadas > 0 ? 'var(--violet-light)' : undefined },
              { icon: 'check',    acc: 'acc-green',   label: 'Vagas livres',   value: vagasLivres,  sub: 'disponíveis agora',  color: 'var(--green)' },
              { icon: 'clock',    acc: '',            label: 'Estadias ativas', value: estadiasAtivas.length, sub: 'em andamento' },
              { icon: 'calendar', acc: 'acc-amber',   label: 'Vagas agendadas', value: reservasPendentes.length, sub: 'aguardando chegada' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color, fontSize: s.small ? '1.4rem' : undefined }}>{s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            {[
              { icon: 'wallet',   acc: 'acc-green',   label: 'Faturamento em aberto', value: faturamentoAberto, sub: 'nas estadias ativas' },
              { icon: 'calendar', acc: 'acc-amber',   label: 'Faturamento da semana', value: relatorio?.faturamento?.semana, sub: 'últimos 7 dias' },
              { icon: 'barChart', acc: 'acc-magenta', label: 'Faturamento do mês', value: relatorio?.faturamento?.mes, sub: 'mês atual' },
              { icon: 'trendUp',  acc: 'acc-orange',  label: 'Faturamento anual', value: relatorio?.faturamento?.ano, sub: 'ano atual' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: 'var(--green)', fontSize: '1.4rem' }}>
                  {s.value != null ? `R$ ${Number(s.value).toFixed(2)}` : '—'}
                </div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Fluxo de veículos (últimos 7 dias)</h2>
            {relatorio?.fluxoSemanal?.length > 0 ? (
              <BarChart
                data={relatorio.fluxoSemanal}
                labelKey="dia"
                series={[
                  { key: 'entradas', label: 'Entradas', color: 'var(--blue-light)' },
                  { key: 'saidas', label: 'Saídas', color: 'var(--green)' },
                ]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="barChart" size={32} /></div>
                <h3>Sem dados de fluxo ainda</h3>
                <p>O gráfico aparecerá assim que houver movimentação registrada.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Faturamento mensal (últimos 12 meses)</h2>
            {relatorio?.faturamentoMensal?.length > 0 ? (
              <BarChart
                data={relatorio.faturamentoMensal}
                labelKey="mes"
                formatValue={v => `R$ ${v.toFixed(2)}`}
                series={[{ key: 'valor', label: 'Faturamento', color: 'var(--green)' }]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="trendUp" size={32} /></div>
                <h3>Sem dados de faturamento ainda</h3>
                <p>O gráfico aparecerá assim que houver estadias finalizadas.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Pátio em tempo real</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setAba('patrio')}>Ver controle →</button>
            </div>
            {vagas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="parking" size={32} /></div>
                <h3>Nenhuma vaga cadastrada</h3>
                <p>Vá em Gerenciar vagas para adicionar a primeira vaga</p>
              </div>
            ) : (
              <div className="vagas-grid">
                {vagas.filter(v => v.ativo !== false).map(v => {
                  const estadia = estadiasAtivas.find(e => e.vaga?.id === v.id);
                  const tempoClasse = estadia ? classeTempo(estadia.entrada) : '';
                  return (
                    <div key={v.id} className={`vaga-tile ${v.ocupada ? 'ocupada' : 'livre'} ${tempoClasse}`}
                      title={estadia ? `${estadia.veiculo?.placa} — ${tempoDecorrido(estadia.entrada)}` : 'Livre'}
                      onClick={() => v.ocupada && setAba('patrio')}>
                      <div className="vaga-tile-icon"><Icon name={v.ocupada ? 'car' : 'parking'} size={20} /></div>
                      <div className="vaga-tile-code" style={{ color: v.ocupada ? 'var(--red)' : 'var(--green)' }}>{v.codigo}</div>
                      {estadia && <div className="vaga-tile-placa">{estadia.veiculo?.placa}</div>}
                      {estadia && <div className="vaga-tile-tempo">{tempoDecorrido(estadia.entrada)}</div>}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Registrar entrada manual</h2>
              <span className={`badge ${vagasLivresPatio.length > 0 ? 'badge-green' : 'badge-red'}`}>
                {vagasLivresPatio.length} {vagasLivresPatio.length === 1 ? 'vaga livre' : 'vagas livres'}
              </span>
            </div>
            {vagas.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="parking" size={32} /></div>
                <h3>Nenhuma vaga cadastrada</h3>
                <p>Vá em Gerenciar vagas para adicionar a primeira vaga</p>
              </div>
            ) : vagasLivresPatio.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="blocked" size={32} /></div>
                <h3>Pátio lotado</h3>
                <p>Não há vagas livres para registrar uma nova entrada agora.</p>
              </div>
            ) : (
              <form className="entrada-form" onSubmit={handleEntrada}>
                <div className="form-group">
                  <label className="form-label">Placa do veículo</label>
                  <input className="form-control placa" placeholder="ABC1234" maxLength={8}
                    value={placaEntrada} onChange={e => setPlacaEntrada(e.target.value.toUpperCase())} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Alocar na vaga</label>
                  <select className="form-control" value={vagaAtual} onChange={e => setVagaSelecionada(e.target.value)} required>
                    {vagasLivresPatio.map(v => {
                      const info = tipoInfo(v.tipoVeiculo);
                      return <option key={v.id} value={v.id}>Vaga {v.codigo} · {info.label}</option>;
                    })}
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" disabled={enviandoEntrada}>
                  {enviandoEntrada
                    ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Registrando...</>
                    : <><Icon name="arrowUp" size={15} /> Liberar cancela</>}
                </button>
              </form>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>
              Veículos no pátio — {estadiasAtivas.length} {estadiasAtivas.length === 1 ? 'ativo' : 'ativos'}
            </h2>
            {estadiasAtivas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="flag" size={32} /></div>
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
                          {est.entrada ? new Date(est.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                          {est.entrada ? tempoDecorrido(est.entrada) : '—'}
                        </td>
                        <td className="hide-mobile" style={{ color: 'var(--green)', fontWeight: 600 }}>
                          {est.entrada ? `R$ ${valorAtual(est.entrada, estacionamento?.valorHora).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {est.pendente ? (
                            <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Icon name="hourglass" size={12} /> Aguardando check-in
                            </span>
                          ) : (
                            <button className="btn btn-success btn-sm" onClick={() => confirmarFinalizar(est.id, est.veiculo?.placa)} disabled={processandoEstadiaId === est.id}>
                              {processandoEstadiaId === est.id
                                ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Encerrando...</>
                                : 'Encerrar'}
                            </button>
                          )}
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

      {/* ══ GERENCIAR VAGAS ══ */}
      {aba === 'vagas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {resumoVagas.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 16, fontSize: '1rem' }}>Resumo por tipo de veículo</h2>
              <div className="resumo-vagas-grid" style={{ marginBottom: 0 }}>
                {resumoVagas.map(r => {
                  const info = tipoInfo(r.tipoVeiculo);
                  return (
                    <div className="resumo-vaga-chip" key={r.tipoVeiculo ?? 'qualquer'}>
                      <span className="resumo-vaga-chip-label"><Icon name={info.icon} size={14} /> {info.label}</span>
                      <span className="resumo-vaga-chip-value">
                        <span style={{ color: 'var(--green)' }}>{r.livres}</span> livres / {r.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Adicionar vaga</h2>
            <form onSubmit={handleAddVaga} className="entrada-form">
              <div className="form-group">
                <label className="form-label">Código da nova vaga</label>
                <input className="form-control placa" placeholder="A-01"
                  value={codigoNovaVaga} onChange={e => setCodigoNovaVaga(e.target.value.toUpperCase())} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de veículo aceito</label>
                <select className="form-control" value={tipoNovaVaga} onChange={e => setTipoNovaVaga(e.target.value)}>
                  <option value="">Qualquer tipo</option>
                  {TIPOS_VEICULO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" type="submit">+ Criar vaga</button>
            </form>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Todas as vagas</h2>
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{vagas.length} cadastradas</span>
            </div>
            {vagas.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon"><Icon name="parking" size={32} /></div>
                <h3>Nenhuma vaga cadastrada</h3>
                <p>Use o formulário acima para criar a primeira vaga</p>
              </div>
            ) : (
              <div className="vaga-manage-grid">
                {vagas.map(v => {
                  const editando = vagaEditando === v.id;
                  const info = tipoInfo(v.tipoVeiculo);
                  const inativa = v.ativo === false;
                  const estadia = estadiasAtivas.find(e => e.vaga?.id === v.id);
                  const status = v.ocupada ? 'Ocupada' : inativa ? 'Inativa' : 'Livre';
                  const statusClass = v.ocupada ? 'badge-red' : inativa ? 'badge-gray' : 'badge-green';

                  return (
                    <div className="vaga-manage-card" key={v.id}>
                      {editando ? (
                        <>
                          <div className="form-group">
                            <label className="form-label">Código</label>
                            <input className="form-control placa" style={{ fontSize: '1rem' }}
                              value={editCodigo} onChange={e => setEditCodigo(e.target.value.toUpperCase())} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tipo aceito</label>
                            <select className="form-control" value={editTipo} onChange={e => setEditTipo(e.target.value)}>
                              <option value="">Qualquer tipo</option>
                              {TIPOS_VEICULO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="vaga-manage-actions">
                            <button className="btn btn-ghost btn-sm" onClick={cancelarEdicaoVaga}>Cancelar</button>
                            <button className="btn btn-success btn-sm" onClick={() => handleSalvarVaga(v.id)}>Salvar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="vaga-manage-head">
                            <span className="placa-badge" style={{ fontSize: '1.05rem' }}>{v.codigo}</span>
                            <span className={`badge ${statusClass}`}>{status}</span>
                          </div>
                          <span className="badge badge-blue" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name={info.icon} size={13} /> {info.label}
                          </span>
                          {estadia && (() => {
                            const tc = classeTempo(estadia.entrada);
                            const cor = tc === 'tempo-muito-alto' ? 'var(--red)' : tc === 'tempo-alto' ? 'var(--amber)' : 'var(--text-secondary)';
                            return (
                              <div className="vaga-manage-est">
                                <span className="placa-badge" style={{ fontSize: '.78rem' }}>{estadia.veiculo?.placa}</span>
                                <span style={{ fontSize: '.75rem', color: cor, fontWeight: tc ? 700 : 400 }}>{tempoDecorrido(estadia.entrada)}</span>
                              </div>
                            );
                          })()}
                          <div className="vaga-manage-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => iniciarEdicaoVaga(v)}>Editar</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleToggleAtivo(v)} disabled={v.ocupada}>
                              {inativa ? 'Ativar' : 'Desativar'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => confirmarDeleteVaga(v.id, v.codigo)} disabled={v.ocupada}>Excluir</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VAGAS AGENDADAS ══ */}
      {aba === 'agendadas' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Reservas aguardando chegada</h2>
            <span className="badge badge-amber">{reservasPendentes.length} {reservasPendentes.length === 1 ? 'pendente' : 'pendentes'}</span>
          </div>
          {reservasPendentes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="calendar" size={32} /></div>
              <h3>Nenhuma vaga agendada</h3>
              <p>As reservas feitas pelos motoristas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Vaga</th>
                    <th className="hide-mobile">Código</th>
                    <th>Reservado em</th>
                    <th className="hide-mobile">Previsão de chegada</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasPendentes.map(est => (
                    <tr key={est.id}>
                      <td>
                        <span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span>
                        {est.veiculo?.modelo && (
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{est.veiculo.modelo}</div>
                        )}
                      </td>
                      <td><span className="badge badge-blue">Vaga {est.vaga?.codigo || est.vaga?.id}</span></td>
                      <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{est.codigo}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.criadoEm)}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.previsaoChegada)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => confirmarCancelarReserva(est.id, est.veiculo?.placa)} disabled={processandoEstadiaId === est.id}>
                          {processandoEstadiaId === est.id
                            ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Cancelando...</>
                            : 'Cancelar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ VALIDAR CHECK-IN ══ */}
      {aba === 'checkin' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--grad-night)', color: '#fff',
              }}>
                <Icon name="search" size={30} />
              </div>
              <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Validar código do motorista</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>
                Digite o código que o motorista apresenta no celular para confirmar a entrada.
              </p>
            </div>
            <form onSubmit={handleCheckin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Código de check-in</label>
                <input ref={checkinInputRef} className="form-control placa" autoFocus
                  style={{ textAlign: 'center', fontSize: 'clamp(1.2rem, 8vw, 1.5rem)', letterSpacing: 'clamp(3px, 1.5vw, 6px)', height: 58 }}
                  placeholder="XXXXXX" maxLength={6}
                  value={codigoCheckin} onChange={e => setCodigoCheckin(e.target.value.toUpperCase())} required
                  disabled={enviandoCheckin} />
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Confirma automaticamente ao completar os 6 caracteres
                </p>
              </div>
              <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={enviandoCheckin}>
                {enviandoCheckin
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Validando...</>
                  : <><Icon name="check" size={16} /> Confirmar check-in</>}
              </button>
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
              <div className="empty-state-icon"><Icon name="list" size={32} /></div>
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
                  <label className="form-label">Valor por hora padrão (R$)</label>
                  <input className="form-control" type="text" inputMode="decimal"
                    value={cfgValorHora} onChange={e => setCfgValorHora(e.target.value.replace(/[^0-9.,]/g, ''))} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" type="submit"><Icon name="save" size={15} /> Salvar alterações</button>
              </div>
            </form>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 6, fontSize: '1rem' }}>Preços por tipo de veículo</h2>
            <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Defina um valor de hora específico por tipo de veículo. Deixe em branco para usar o valor padrão
              (R$ {Number(cfgValorHora || 0).toFixed(2)}/h).
            </p>
            <form onSubmit={handleSalvarPrecos} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="precos-grid">
                {TIPOS_VEICULO.map(t => (
                  <div className="form-group" key={t.id}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name={t.icon} size={13} /> {t.label} (R$/hora)
                    </label>
                    <input className="form-control" type="text" inputMode="decimal"
                      placeholder={`Padrão: R$ ${Number(cfgValorHora || 0).toFixed(2)}`}
                      value={precos[t.id]} onChange={e => setPrecos(p => ({ ...p, [t.id]: e.target.value.replace(/[^0-9.,]/g, '') }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" type="submit" disabled={salvandoPrecos}>
                  {salvandoPrecos
                    ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
                    : <><Icon name="save" size={15} /> Salvar preços</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalConfirm
        aberto={!!confirmacao}
        titulo={confirmacao?.titulo}
        mensagem={confirmacao?.mensagem}
        corConfirmar={confirmacao?.corConfirmar}
        textoConfirmar={confirmacao?.textoConfirmar}
        onConfirmar={confirmacao?.onConfirmar}
        onCancelar={() => setConfirmacao(null)}
      />

    </PainelLayout>
  );
}
