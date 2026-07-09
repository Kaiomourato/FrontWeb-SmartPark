import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import ProgressoOcupacao from '../../components/ProgressoOcupacao';
import Icon from '../../components/Icon';

export default function EstacionamentosAdmin() {
  const [loading, setLoading] = useState(true);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/estacionamentos');
      setEstacionamentos(data);
    } catch { setEstacionamentos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = estacionamentos.filter(e =>
    e.nome?.toLowerCase().includes(busca.toLowerCase()) || e.endereco?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="filtros-bar">
          <div className="form-group">
            <label className="form-label">Buscar</label>
            <input className="form-control" placeholder="Nome ou endereço..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Estacionamentos</h2>
          {!loading && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{filtrados.length} de {estacionamentos.length}</span>}
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /><span>Carregando...</span></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="layers" size={32} /></div>
            <h3>Nenhum estacionamento encontrado</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="hide-mobile">Endereço</th>
                  <th>Vagas</th>
                  <th style={{ minWidth: 150 }}>Ocupação</th>
                  <th style={{ textAlign: 'right' }}>Valor/hora</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(e => {
                  const total = e.vagasTotais ?? 0;
                  const ocupadas = e.vagasOcupadas ?? 0;
                  const pct = total > 0 ? (ocupadas / total) * 100 : 0;
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.nome}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                        <Icon name="pin" size={12} /> {e.endereco}
                      </td>
                      <td><span className="badge badge-blue">{ocupadas}/{total}</span></td>
                      <td><ProgressoOcupacao percentual={pct} /></td>
                      <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>R$ {Number(e.valorHora || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
