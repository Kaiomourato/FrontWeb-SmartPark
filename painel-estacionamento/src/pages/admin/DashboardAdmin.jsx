import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import BarChart from '../../components/BarChart';
import MapaEstacionamentos from '../../components/admin/MapaEstacionamentos';
import Skeleton, { SkeletonStatCard, SkeletonCard } from '../../components/Skeleton';
import Icon from '../../components/Icon';

function formatarMoeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2)}`;
}

function formatarDataHora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function Variacao({ percentual }) {
  if (percentual == null) return null;
  const positivo = percentual >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: positivo ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
      <Icon name={positivo ? 'trendUp' : 'arrowDown'} size={12} />
      {Math.abs(percentual).toFixed(1)}%
    </span>
  );
}

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [estacionamentoFiltro, setEstacionamentoFiltro] = useState('');
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

  const carregarTudo = useCallback(async () => {
    const params = estacionamentoFiltro ? { estacionamentoId: estacionamentoFiltro } : {};
    const paramsEstadias = { ...params, limite: 8 };
    const [dashR, usuariosR, checkinsR, checkoutsR] = await Promise.allSettled([
      api.get('/admin/dashboard', { params }),
      api.get('/admin/usuarios/recentes'),
      api.get('/admin/estadias/ultimos-checkins', { params: paramsEstadias }),
      api.get('/admin/estadias/ultimos-checkouts', { params: paramsEstadias }),
    ]);
    setDashboard(dashR.status === 'fulfilled' ? dashR.value.data : null);
    setUsuariosRecentes(usuariosR.status === 'fulfilled' ? usuariosR.value.data : []);
    setUltimosCheckins(checkinsR.status === 'fulfilled' ? checkinsR.value.data : []);
    setUltimosCheckouts(checkoutsR.status === 'fulfilled' ? checkoutsR.value.data : []);
  }, [estacionamentoFiltro]);

  useEffect(() => { carregarEstacionamentos(); }, [carregarEstacionamentos]);
  useEffect(() => { setLoading(true); carregarTudo().finally(() => setLoading(false)); }, [carregarTudo]);

  const cards = dashboard?.cards;
  const indicadores = dashboard?.indicadores;
  const financeiro = dashboard?.financeiro;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Filtro por estacionamento */}
      <div className="card" style={{ padding: 20 }}>
        <div className="filtros-bar">
          <div className="form-group">
            <label className="form-label">Estacionamento</label>
            <select className="form-control" value={estacionamentoFiltro} onChange={e => setEstacionamentoFiltro(e.target.value)}>
              <option value="">Rede completa (todos)</option>
              {estacionamentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ══ LINHA 1 — visão geral ══ */}
      <div>
        <h2 className="dashboard-section-title">Visão geral</h2>
        <div className="stats-grid stats-grid-6">
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />) : [
            { icon: 'users',   acc: 'acc-magenta', label: 'Usuários',       value: cards?.totalUsuarios },
            { icon: 'shield',  acc: '',            label: 'Operadores',     value: cards?.totalOperadores },
            { icon: 'user',    acc: 'acc-orange',  label: 'Administradores', value: cards?.totalAdministradores },
            { icon: 'layers',  acc: 'acc-amber',   label: 'Estacionamentos', value: cards?.totalEstacionamentos },
            { icon: 'parking', acc: 'acc-green',   label: 'Vagas totais',   value: cards?.totalVagas },
            { icon: 'gauge',   acc: 'acc-magenta', label: 'Ocupação média', value: cards ? `${cards.taxaMediaOcupacao.toFixed(0)}%` : '—' },
          ].map((s, i) => (
            <div className="stat-card" key={i} title={s.label}>
              <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{s.value ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ LINHA 2 — financeiro ══ */}
      <div>
        <h2 className="dashboard-section-title">Financeiro</h2>
        <div className="stats-grid stats-grid-6">
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />) : [
            { icon: 'wallet',   acc: 'acc-green',  label: 'Receita hoje',  value: formatarMoeda(cards?.receitaHoje) },
            { icon: 'calendar', acc: 'acc-amber',  label: 'Receita semana', value: formatarMoeda(cards?.receitaSemana) },
            { icon: 'barChart', acc: 'acc-magenta',label: 'Receita mês',    value: formatarMoeda(cards?.receitaMes) },
            { icon: 'trendUp',  acc: 'acc-orange', label: 'Receita anual',  value: formatarMoeda(cards?.receitaAno) },
            { icon: 'ticket',   acc: '',           label: 'Ticket médio',   value: formatarMoeda(cards?.ticketMedio) },
            { icon: 'clock',    acc: 'acc-green',  label: 'Tempo médio de estadia', value: cards?.tempoMedioEstadiaMinutos != null ? `${Math.round(cards.tempoMedioEstadiaMinutos)} min` : '—' },
          ].map((s, i) => (
            <div className="stat-card" key={i} title={s.label}>
              <div className={`stat-card-icon ${s.acc}`}><Icon name={s.icon} size={18} /></div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value" style={{ fontSize: '1.35rem', color: 'var(--green)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ INDICADORES ══ */}
      <div>
        <h2 className="dashboard-section-title">Indicadores</h2>
        {loading ? (
          <div className="card" style={{ padding: 20 }}><Skeleton height={80} /></div>
        ) : (
          <div className="indicadores-grid">
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="users" size={13} /> Usuários online</span>
              <span className="indicador-chip-value">{indicadores?.usuariosOnline ?? 0}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="trendUp" size={13} /> Crescimento de usuários</span>
              <span className="indicador-chip-value"><Variacao percentual={indicadores?.crescimentoUsuariosPercentual} /></span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="wallet" size={13} /> Crescimento financeiro</span>
              <span className="indicador-chip-value"><Variacao percentual={indicadores?.crescimentoFinanceiroPercentual} /></span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="layers" size={13} /> Mais movimentado</span>
              <span className="indicador-chip-value" style={{ fontSize: '.85rem' }}>{indicadores?.estacionamentoMaisMovimentado || '—'}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="wallet" size={13} /> Mais lucrativo</span>
              <span className="indicador-chip-value" style={{ fontSize: '.85rem' }}>{indicadores?.estacionamentoMaisLucrativo || '—'}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="arrowUp" size={13} /> Check-ins hoje</span>
              <span className="indicador-chip-value">{indicadores?.totalCheckinsHoje ?? 0}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="arrowDown" size={13} /> Check-outs hoje</span>
              <span className="indicador-chip-value">{indicadores?.totalCheckoutsHoje ?? 0}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="list" size={13} /> Média diária de acessos</span>
              <span className="indicador-chip-value">{indicadores?.mediaDiariaAcessos ?? 0}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="clock" size={13} /> Pico de utilização</span>
              <span className="indicador-chip-value">{indicadores?.picoUtilizacaoHora != null ? `${String(indicadores.picoUtilizacaoHora).padStart(2, '0')}h` : '—'}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="ticket" size={13} /> Pagamentos no mês</span>
              <span className="indicador-chip-value">{indicadores?.totalPagamentosRealizados ?? 0}</span>
            </div>
            <div className="indicador-chip">
              <span className="indicador-chip-label"><Icon name="trendUp" size={13} /> Receita prevista do mês</span>
              <span className="indicador-chip-value" style={{ color: 'var(--green)' }}>{formatarMoeda(indicadores?.receitaPrevistaMes)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ══ LINHA 3 — gráficos ══ */}
      <div>
        <h2 className="dashboard-section-title">Gráficos</h2>
        <div className="dashboard-charts-grid">
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : (
            <>
              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Check-ins por dia (7 dias)</h3>
                {financeiro?.fluxoSemanal?.length > 0 ? (
                  <BarChart data={financeiro.fluxoSemanal} labelKey="data" series={[{ key: 'entradas', label: 'Check-ins', color: 'var(--blue-light)' }]} />
                ) : <EmptyMini icon="arrowUp" />}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Check-outs por dia (7 dias)</h3>
                {financeiro?.fluxoSemanal?.length > 0 ? (
                  <BarChart data={financeiro.fluxoSemanal} labelKey="data" series={[{ key: 'saidas', label: 'Check-outs', color: 'var(--magenta-light)' }]} />
                ) : <EmptyMini icon="arrowDown" />}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Receita mensal (12 meses)</h3>
                {financeiro?.faturamentoMensal?.length > 0 ? (
                  <BarChart data={financeiro.faturamentoMensal} labelKey="data" formatValue={formatarMoeda} series={[{ key: 'valor', label: 'Receita', color: 'var(--green)' }]} />
                ) : <EmptyMini icon="trendUp" />}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Novos usuários por mês (12 meses)</h3>
                {dashboard?.crescimentoUsuarios?.length > 0 ? (
                  <BarChart data={dashboard.crescimentoUsuarios} labelKey="rotulo" series={[{ key: 'quantidade', label: 'Novos usuários', color: 'var(--violet-light)' }]} />
                ) : <EmptyMini icon="users" />}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Horários com maior movimento (30 dias)</h3>
                {dashboard?.horariosMovimento?.some(h => h.quantidade > 0) ? (
                  <BarChart data={dashboard.horariosMovimento} labelKey="rotulo" series={[{ key: 'quantidade', label: 'Check-ins', color: 'var(--orange-light)' }]} />
                ) : <EmptyMini icon="clock" />}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="dashboard-chart-title">Top estacionamentos (por estadias)</h3>
                {dashboard?.topEstacionamentos?.length > 0 ? (
                  <BarChart data={dashboard.topEstacionamentos.slice(0, 8)} labelKey="nome" series={[{ key: 'totalEstadias', label: 'Estadias', color: 'var(--magenta-light)' }]} />
                ) : <EmptyMini icon="layers" />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ LINHA 4 — mapa ══ */}
      <div>
        <h2 className="dashboard-section-title">Mapa da rede</h2>
        <div className="card" style={{ padding: 24 }}>
          {loading ? <Skeleton height={420} radius={10} /> : (
            <MapaEstacionamentos estacionamentos={estacionamentos} ranking={dashboard?.topEstacionamentos} />
          )}
        </div>
      </div>

      {/* ══ LINHA 5 — tabelas ══ */}
      <div>
        <h2 className="dashboard-section-title">Atividade recente</h2>
        <div className="dashboard-tables-grid">
          <div className="card" style={{ padding: 24 }}>
            <h3 className="dashboard-chart-title">Últimos usuários cadastrados</h3>
            {loading ? <Skeleton height={180} /> : usuariosRecentes.length === 0 ? <EmptyMini icon="users" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>E-mail</th><th>Tipo</th><th>Cadastrado em</th></tr></thead>
                  <tbody>
                    {usuariosRecentes.slice(0, 8).map(u => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td><span className="badge badge-blue">{u.tipo}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{u.criadoEm ? formatarDataHora(u.criadoEm) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 className="dashboard-chart-title">Últimos check-ins</h3>
            {loading ? <Skeleton height={180} /> : ultimosCheckins.length === 0 ? <EmptyMini icon="arrowUp" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Placa</th><th>Estacionamento</th><th>Entrada</th></tr></thead>
                  <tbody>
                    {ultimosCheckins.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td>{est.vaga?.estacionamento?.nome || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{formatarDataHora(est.entrada)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 className="dashboard-chart-title">Últimos check-outs</h3>
            {loading ? <Skeleton height={180} /> : ultimosCheckouts.length === 0 ? <EmptyMini icon="arrowDown" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Placa</th><th>Estacionamento</th><th>Saída</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                  <tbody>
                    {ultimosCheckouts.map(est => (
                      <tr key={est.id}>
                        <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                        <td>{est.vaga?.estacionamento?.nome || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{formatarDataHora(est.saida)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{est.valor != null ? formatarMoeda(est.valor) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyMini({ icon }) {
  return (
    <div className="empty-state" style={{ padding: '20px 0' }}>
      <div className="empty-state-icon"><Icon name={icon} size={28} /></div>
      <p>Sem dados ainda</p>
    </div>
  );
}
