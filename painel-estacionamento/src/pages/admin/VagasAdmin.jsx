import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Paginacao from '../../components/Paginacao';
import Icon from '../../components/Icon';

const TIPOS_VEICULO = { CARRO: 'Carro', MOTO: 'Moto', CAMINHONETE: 'Caminhonete' };

export default function VagasAdmin() {
  const [loading, setLoading] = useState(true);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [estacionamentoFiltro, setEstacionamentoFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState({ content: [], totalPages: 0, totalElements: 0 });

  useEffect(() => {
    api.get('/estacionamentos').then(r => setEstacionamentos(r.data)).catch(() => setEstacionamentos([]));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/vagas', {
        params: { estacionamentoId: estacionamentoFiltro || undefined, busca: buscaAplicada || undefined, page: pagina, size: 15 },
      });
      setDados(data);
    } catch { setDados({ content: [], totalPages: 0, totalElements: 0 }); }
    finally { setLoading(false); }
  }, [estacionamentoFiltro, buscaAplicada, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(0); }, [estacionamentoFiltro, buscaAplicada]);

  const handleBuscar = (e) => { e.preventDefault(); setBuscaAplicada(busca.trim()); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <form className="filtros-bar" onSubmit={handleBuscar}>
          <div className="form-group" style={{ flex: '2 1 220px' }}>
            <label className="form-label">Buscar por código</label>
            <input className="form-control" placeholder="Ex: A-01" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Estacionamento</label>
            <select className="form-control" value={estacionamentoFiltro} onChange={e => setEstacionamentoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {estacionamentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" style={{ height: 44 }}>
            <Icon name="search" size={15} /> Buscar
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Vagas</h2>
          {!loading && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{dados.totalElements} no total</span>}
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /><span>Carregando...</span></div>
        ) : dados.content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="parking" size={32} /></div>
            <h3>Nenhuma vaga encontrada</h3>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Estacionamento</th>
                    <th className="hide-mobile">Tipo aceito</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.content.map(v => {
                    const inativa = v.ativo === false;
                    const status = v.ocupada ? 'Ocupada' : inativa ? 'Inativa' : 'Livre';
                    const statusClass = v.ocupada ? 'badge-red' : inativa ? 'badge-gray' : 'badge-green';
                    return (
                      <tr key={v.id}>
                        <td><span className="placa-badge" style={{ fontSize: '.85rem' }}>{v.codigo}</span></td>
                        <td>{v.estacionamento?.nome || '—'}</td>
                        <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                          {v.tipoVeiculo ? TIPOS_VEICULO[v.tipoVeiculo] : 'Qualquer tipo'}
                        </td>
                        <td><span className={`badge ${statusClass}`}>{status}</span></td>
                      </tr>
                    );
                  })}
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
