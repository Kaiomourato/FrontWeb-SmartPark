import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Paginacao from '../../components/Paginacao';
import Icon from '../../components/Icon';
import EstadoErro from '../../components/EstadoErro';
import { SkeletonTable } from '../../components/Skeleton';
import { formatarDataHora as formatarDataHoraBase } from '../../utils/formatadores';

const TIPO_INFO = {
  ADMIN: { label: 'Administrador', badge: 'badge-magenta' },
  OPERADOR: { label: 'Operador', badge: 'badge-blue' },
  MOTORISTA: { label: 'Motorista', badge: 'badge-gray' },
};

const formatarDataHora = (data) => formatarDataHoraBase(data, { comAno: true });

// Usada tanto pela página "Usuários" (sem filtro) quanto "Operadores"
// (tipoFixo="OPERADOR") — evita duplicar a listagem/paginação/busca.
export default function UsuariosAdmin({ tipoFixo }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [roleFiltro, setRoleFiltro] = useState('');
  const [dados, setDados] = useState({ content: [], totalPages: 0, totalElements: 0 });

  const role = tipoFixo === 'OPERADOR' ? 'OPERADOR' : (roleFiltro || undefined);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    try {
      const { data } = await api.get('/admin/usuarios', {
        params: { role, busca: buscaAplicada || undefined, page: pagina, size: 15 },
      });
      setDados(data);
    } catch {
      setDados({ content: [], totalPages: 0, totalElements: 0 });
      setErro(true);
    } finally { setLoading(false); }
  }, [role, buscaAplicada, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(0); }, [role, buscaAplicada]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setBuscaAplicada(busca.trim());
  };

  const titulo = tipoFixo === 'OPERADOR' ? 'Operadores' : 'Usuários';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <form className="filtros-bar" onSubmit={handleBuscar}>
          <div className="form-group" style={{ flex: '2 1 260px' }}>
            <label className="form-label">Buscar por e-mail</label>
            <input className="form-control" placeholder="nome@exemplo.com" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {!tipoFixo && (
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-control" value={roleFiltro} onChange={e => setRoleFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="OPERADOR">Operador</option>
                <option value="USER">Motorista</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary" type="submit" style={{ height: 44 }}>
            <Icon name="search" size={15} /> Buscar
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>{titulo}</h2>
          {!loading && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{dados.totalElements} no total</span>}
        </div>

        {loading ? (
          <SkeletonTable colunas={4} />
        ) : erro ? (
          <EstadoErro mensagem="Não foi possível carregar os usuários." onTentarNovamente={carregar} />
        ) : dados.content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="users" size={32} /></div>
            <h3>Nenhum resultado</h3>
            <p>Ajuste a busca ou o filtro de tipo.</p>
          </div>
        ) : (
          <>
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
                  {dados.content.map(u => {
                    const info = TIPO_INFO[u.tipo] || TIPO_INFO.MOTORISTA;
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
            <Paginacao pagina={dados.number ?? pagina} totalPaginas={dados.totalPages} totalElementos={dados.totalElements} onMudarPagina={setPagina} />
          </>
        )}
      </div>
    </div>
  );
}
