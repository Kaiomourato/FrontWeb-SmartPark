import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PainelLayout from '../components/PainelLayout';
import BarChart from '../components/BarChart';
import ProgressoOcupacao from '../components/ProgressoOcupacao';
import Icon from '../components/Icon';

const NAV = [
  {
    label: 'Administração',
    items: [
      { id: 'dashboard',  icon: <Icon name="gauge" size={18} />, label: 'Dashboard' },
      { id: 'atividade',  icon: <Icon name="list" size={18} />,  label: 'Atividade recente' },
    ],
  },
];

const PERIODOS = [
  { id: '7d',  label: 'Últimos 7 dias',   dias: 7 },
  { id: '30d', label: 'Últimos 30 dias',  dias: 30 },
  { id: '90d', label: 'Últimos 90 dias',  dias: 90 },
  { id: '12m', label: 'Últimos 12 meses', dias: 365 },
];

function isoDia(data) {
  return data.toISOString().slice(0, 10);
}

function formatarDataHora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatarMoeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2)}`;
}

const TIPO_USUARIO_INFO = {
  ADMIN:     { label: 'Administrador', badge: 'badge-magenta' },
  OPERADOR:  { label: 'Operador',      badge: 'badge-blue' },
  MOTORISTA: { label: 'Motorista',     badge: 'badge-gray' },
};

export default function PainelAdmin() {
  const { user } = useAuth();
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [periodo, setPeriodo] = useState('30d');
  const [estacionamentoFiltro, setEstacionamentoFiltro] = useState('');
  const [estacionamentos, setEstacionamentos] = useState([]);

  const [dashboard, setDashboard] = useState(null);
  const [usuariosRecentes, setUsuariosRecentes] = useState([]);
  const [ultimosCheckins, setUltimosCheckins] = useState([]);
  const [ultimosCheckouts, setUltimosCheckouts] = useState([]);

  const carregarEstacionamentos = useCallback(async () => {
    try {
      const { data } = await api.get('/estacionamentos');
      setEstacionamentos(data);
    } catch { setEstacionamentos([]); }
  }, []);

  const carregarDashboard = useCallback(async () => {
    const preset = PERIODOS.find(p => p.id === periodo) || PERIODOS[1];
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - (preset.dias - 1));

    const params = { inicio: isoDia(inicio), fim: isoDia(fim) };
    if (estacionamentoFiltro) params.estacionamentoId = estacionamentoFiltro;

    try {
      const { data } = await api.get('/admin/dashboard', { params });
      setDashboard(data);
    } catch (err) { console.error(err); setDashboard(null); }
  }, [periodo, estacionamentoFiltro]);

  const carregarTabelas = useCallback(async () => {
    const paramsEstadias = estacionamentoFiltro ? { estacionamentoId: estacionamentoFiltro, limite: 10 } : { limite: 10 };
    const [usuariosR, checkinsR, checkoutsR] = await Promise.allSettled([
      api.get('/admin/usuarios/recentes'),
      api.get('/admin/estadias/ultimos-checkins', { params: paramsEstadias }),
      api.get('/admin/estadias/ultimos-checkouts', { params: paramsEstadias }),
    ]);
    setUsuariosRecentes(usuariosR.status === 'fulfilled' ? usuariosR.value.data : []);
    setUltimosCheckins(checkinsR.status === 'fulfilled' ? checkinsR.value.data : []);
    setUltimosCheckouts(checkoutsR.status === 'fulfilled' ? checkoutsR.value.data : []);
  }, [estacionamentoFiltro]);

  useEffect(() => { carregarEstacionamentos(); }, [carregarEstacionamentos]);

  useEffect(() => {
    setLoading(true);
    Promise.all([carregarDashboard(), carregarTabelas()]).finally(() => setLoading(false));
  }, [carregarDashboard, carregarTabelas]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span>Carregando painel...</span>
    </div>
  );

  const cards = dashboard?.cards;
  const financeiro = dashboard?.financeiro;

  return (
    <PainelLayout
      aba={aba} setAba={setAba} itens={NAV}
      subtitulo={user?.email || 'Admin'}
      topbarTitle={aba === 'dashboard' ? 'Dashboard' : 'Atividade recente'}
    >
      {/* ══ FILTROS ══ */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="filtros-bar">
          <div className="form-group">
            <label className="form-label">Período</label>
            <select className="form-control" value={periodo} onChange={e => setPeriodo(e.target.value)}>
              {PERIODOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estacionamento</label>
            <select className="form-control" value={estacionamentoFiltro} onChange={e => setEstacionamentoFiltro(e.target.value)}>
              <option value="">Todos os estacionamentos</option>
              {estacionamentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ══ DASHBOARD ══ */}
      {aba === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div className="stats-grid">
            {[
              { icon: 'users',  acc: 'acc-magenta', label: 'Usuários cadastrados', value: cards?.totalUsuarios, sub: 'no sistema' },
              { icon: 'shield', acc: '',            label: 'Administradores',      value: cards?.totalAdministradores, sub: 'com acesso total' },
              { icon: 'parking',acc: 'acc-green',   label: 'Operadores',           value: cards?.totalOperadores, sub: 'vinculados a um estacionamento' },
              { icon: 'car',    acc: 'acc-amber',   label: 'Motoristas',           value: cards?.totalMotoristas, sub: 'usuários comuns' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value ?? '—'}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            {[
              { icon: 'layers',  acc: 'acc-orange',  label: 'Estacionamentos', value: cards?.totalEstacionamentos, sub: `${cards?.estacionamentosAtivos ?? 0} ativos · ${cards?.estacionamentosInativos ?? 0} inativos` },
              { icon: 'parking', acc: '',             label: 'Vagas totais',    value: cards?.totalVagas, sub: 'cadastradas e ativas' },
              { icon: 'check',   acc: 'acc-green',    label: 'Vagas livres',    value: cards?.vagasLivres, sub: 'disponíveis agora' },
              { icon: 'car',     acc: 'acc-magenta',  label: 'Vagas ocupadas',  value: cards?.vagasOcupadas, sub: 'em uso agora' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value ?? '—'}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            {[
              { icon: 'arrowUp',   acc: 'acc-green',   label: 'Check-ins no período',  value: cards?.totalCheckins, sub: 'entradas registradas' },
              { icon: 'arrowDown', acc: 'acc-magenta', label: 'Check-outs no período', value: cards?.totalCheckouts, sub: 'saídas registradas' },
              { icon: 'wallet',    acc: 'acc-amber',   label: 'Faturamento no período', value: cards ? formatarMoeda(cards.faturamentoTotal) : '—', sub: 'estadias finalizadas', small: true },
              { icon: 'clock',     acc: '',             label: 'Tempo médio de permanência', value: cards?.tempoMedioPermanenciaMinutos != null ? `${Math.round(cards.tempoMedioPermanenciaMinutos)} min` : '—', sub: 'por estadia finalizada', small: true },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ fontSize: s.small ? '1.4rem' : undefined }}>{s.value ?? '—'}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            {[
              { icon: 'list',    acc: '',            label: 'Acessos ao sistema', value: cards?.totalAcessos, sub: `média de ${cards?.mediaDiariaUtilizacao ?? 0}/dia` },
              { icon: 'check',   acc: 'acc-green',   label: 'Logins realizados',  value: cards?.totalLogins, sub: 'no período' },
              { icon: 'users',   acc: 'acc-magenta', label: 'Usuários ativos',    value: cards?.usuariosAtivos24h, sub: 'nas últimas 24h' },
              { icon: 'trendUp', acc: 'acc-orange',  label: 'Pico de utilização', value: cards?.picoUtilizacaoHora != null ? `${String(cards.picoUtilizacaoHora).padStart(2, '0')}h` : '—', sub: 'horário com mais acessos' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value ?? '—'}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Distribuição de vagas */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 16, fontSize: '1rem' }}>Distribuição de vagas</h2>
            <ProgressoOcupacao percentual={cards && cards.totalVagas > 0 ? (cards.vagasOcupadas / cards.totalVagas) * 100 : 0} height={12} />
            <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: 10 }}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>{cards?.vagasLivres ?? 0} livres</span>
              {' · '}
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>{cards?.vagasOcupadas ?? 0} ocupadas</span>
              {' de '}{cards?.totalVagas ?? 0} vagas totais
            </p>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Check-ins e check-outs (últimos 7 dias)</h2>
            {financeiro?.fluxoSemanal?.length > 0 ? (
              <BarChart
                data={financeiro.fluxoSemanal}
                labelKey="data"
                series={[
                  { key: 'entradas', label: 'Check-ins', color: 'var(--blue-light)' },
                  { key: 'saidas', label: 'Check-outs', color: 'var(--green)' },
                ]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="barChart" size={32} /></div>
                <h3>Sem dados ainda</h3>
                <p>O gráfico aparecerá assim que houver movimentação registrada.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Faturamento do sistema (últimos 12 meses)</h2>
            {financeiro?.faturamentoMensal?.length > 0 ? (
              <BarChart
                data={financeiro.faturamentoMensal}
                labelKey="data"
                formatValue={v => formatarMoeda(v)}
                series={[{ key: 'valor', label: 'Faturamento', color: 'var(--green)' }]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="trendUp" size={32} /></div>
                <h3>Sem dados ainda</h3>
                <p>O gráfico aparecerá assim que houver estadias finalizadas.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Check-ins por mês (últimos 12 meses)</h2>
            {dashboard?.checkinsPorMes?.length > 0 ? (
              <BarChart
                data={dashboard.checkinsPorMes}
                labelKey="rotulo"
                series={[{ key: 'quantidade', label: 'Check-ins', color: 'var(--blue-light)' }]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="barChart" size={32} /></div>
                <h3>Sem dados ainda</h3>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Crescimento de usuários cadastrados (últimos 12 meses)</h2>
            {dashboard?.crescimentoUsuarios?.length > 0 ? (
              <BarChart
                data={dashboard.crescimentoUsuarios}
                labelKey="rotulo"
                series={[{ key: 'quantidade', label: 'Novos usuários', color: 'var(--violet-light)' }]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="users" size={32} /></div>
                <h3>Sem dados ainda</h3>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Horários com maior movimento (check-ins por hora, no período)</h2>
            {dashboard?.horariosMovimento?.some(h => h.quantidade > 0) ? (
              <BarChart
                data={dashboard.horariosMovimento}
                labelKey="rotulo"
                series={[{ key: 'quantidade', label: 'Check-ins', color: 'var(--blue-light)' }]}
              />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-icon"><Icon name="clock" size={32} /></div>
                <h3>Sem dados ainda</h3>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Ranking e ocupação dos estacionamentos</h2>
            {dashboard?.ocupacaoEstacionamentos?.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estacionamento</th>
                      <th>Estadias registradas</th>
                      <th className="hide-mobile">Vagas</th>
                      <th>Ocupação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.ocupacaoEstacionamentos.map(e => (
                      <tr key={e.estacionamentoId}>
                        <td style={{ fontWeight: 600 }}>{e.nome}</td>
                        <td><span className="badge badge-blue">{e.totalEstadias}</span></td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                          {e.vagasOcupadas}/{e.vagasTotais}
                        </td>
                        <td style={{ minWidth: 160 }}><ProgressoOcupacao percentual={e.ocupacaoPercentual} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="layers" size={32} /></div>
                <h3>Nenhum estacionamento cadastrado</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ATIVIDADE RECENTE ══ */}
      {aba === 'atividade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Últimos usuários cadastrados</h2>
            {usuariosRecentes.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Icon name="users" size={32} /></div><h3>Nenhum usuário ainda</h3></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>E-mail</th>
                      <th>Tipo</th>
                      <th className="hide-mobile">Estacionamento</th>
                      <th>Cadastrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosRecentes.map(u => {
                      const info = TIPO_USUARIO_INFO[u.tipo] || TIPO_USUARIO_INFO.MOTORISTA;
                      return (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td><span className={`badge ${info.badge}`}>{info.label}</span></td>
                          <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{u.estacionamentoNome || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{u.criadoEm ? formatarDataHora(u.criadoEm) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Últimos check-ins</h2>
            {ultimosCheckins.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Icon name="arrowUp" size={32} /></div><h3>Nenhum check-in ainda</h3></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Estacionamento</th>
                      <th className="hide-mobile">Vaga</th>
                      <th>Entrada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosCheckins.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td>{est.vaga?.estacionamento?.nome || '—'}</td>
                        <td className="hide-mobile"><span className="badge badge-blue">Vaga {est.vaga?.codigo || est.vaga?.id}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.entrada)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Últimos check-outs</h2>
            {ultimosCheckouts.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Icon name="arrowDown" size={32} /></div><h3>Nenhum check-out ainda</h3></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Estacionamento</th>
                      <th className="hide-mobile">Vaga</th>
                      <th>Saída</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosCheckouts.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td>{est.vaga?.estacionamento?.nome || '—'}</td>
                        <td className="hide-mobile"><span className="badge badge-blue">Vaga {est.vaga?.codigo || est.vaga?.id}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.saida)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{est.valor != null ? formatarMoeda(est.valor) : '—'}</td>
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
