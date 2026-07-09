import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Paginacao from '../../components/Paginacao';
import Icon from '../../components/Icon';
import EstadoErro from '../../components/EstadoErro';
import { SkeletonTable } from '../../components/Skeleton';
import { formatarDataHora, formatarMoeda } from '../../utils/formatadores';

function duracao(entrada, saida) {
  if (!entrada || !saida) return '—';
  const ms = new Date(saida).getTime() - new Date(entrada).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function PagamentosAdmin() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [estacionamentoFiltro, setEstacionamentoFiltro] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState({ content: [], totalPages: 0, totalElements: 0 });

  useEffect(() => {
    api.get('/estacionamentos').then(r => setEstacionamentos(r.data)).catch(() => setEstacionamentos([]));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    try {
      const { data } = await api.get('/admin/pagamentos', {
        params: {
          estacionamentoId: estacionamentoFiltro || undefined,
          inicio: inicio || undefined,
          fim: fim || undefined,
          page: pagina, size: 15,
        },
      });
      setDados(data);
    } catch {
      setDados({ content: [], totalPages: 0, totalElements: 0 });
      setErro(true);
    } finally { setLoading(false); }
  }, [estacionamentoFiltro, inicio, fim, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(0); }, [estacionamentoFiltro, inicio, fim]);

  const totalPagina = dados.content.reduce((acc, e) => acc + (e.valor || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="filtros-bar">
          <div className="form-group">
            <label className="form-label">Estacionamento</label>
            <select className="form-control" value={estacionamentoFiltro} onChange={e => setEstacionamentoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {estacionamentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">De</label>
            <input className="form-control" type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Até</label>
            <input className="form-control" type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Pagamentos</h2>
          {!loading && (
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
              {dados.totalElements} no total · {formatarMoeda(totalPagina)} nesta página
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonTable colunas={6} />
        ) : erro ? (
          <EstadoErro mensagem="Não foi possível carregar os pagamentos." onTentarNovamente={carregar} />
        ) : dados.content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="wallet" size={32} /></div>
            <h3>Nenhum pagamento encontrado</h3>
            <p>Ajuste os filtros de estacionamento ou período.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Estacionamento</th>
                    <th className="hide-mobile">Entrada</th>
                    <th>Saída</th>
                    <th className="hide-mobile">Duração</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.content.map(est => (
                    <tr key={est.id}>
                      <td><span className="placa-badge">{est.veiculo?.placa || 'N/A'}</span></td>
                      <td>{est.vaga?.estacionamento?.nome || '—'}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.entrada)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{formatarDataHora(est.saida)}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{duracao(est.entrada, est.saida)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>{formatarMoeda(est.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao pagina={dados.number ?? pagina} totalPaginas={dados.totalPages} totalElementos={dados.totalElements} onMudarPagina={setPagina} />
          </>
        )}
      </div>
    </div>
  );
}
