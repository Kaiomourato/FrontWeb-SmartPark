import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Paginacao from '../../components/Paginacao';
import Icon from '../../components/Icon';
import EstadoErro from '../../components/EstadoErro';
import { SkeletonTable } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';
import { formatarDataHora as formatarDataHoraBase } from '../../utils/formatadores';

const ROLE_LABEL = { ADMIN: 'Administrador', OPERADOR: 'Operador', USER: 'Motorista' };

const TIPO_EVENTO_LABEL = {
  LOGIN: 'Login', LOGOUT: 'Logout', CADASTRO: 'Cadastro',
  CRIACAO_ESTACIONAMENTO: 'Criação de estacionamento', EDICAO_ESTACIONAMENTO: 'Edição de estacionamento',
  CRIACAO_VAGA: 'Criação de vaga', EDICAO_VAGA: 'Edição de vaga', EXCLUSAO_VAGA: 'Exclusão de vaga',
  CHECKIN: 'Check-in', RESERVA: 'Reserva', CANCELAMENTO: 'Cancelamento',
  CHECKOUT_PAGAMENTO: 'Check-out/Pagamento', EXCLUSAO: 'Exclusão',
  ACESSO_PAINEL_ADMIN: 'Acesso ao painel admin', ACESSO_NAO_AUTORIZADO: 'Acesso não autorizado',
  ERRO: 'Erro', OUTRO: 'Outro',
};

function badgeTipoEvento(tipo) {
  if (tipo === 'ACESSO_NAO_AUTORIZADO' || tipo === 'ERRO') return 'badge-red';
  if (tipo === 'LOGIN' || tipo === 'CHECKIN' || tipo === 'CHECKOUT_PAGAMENTO') return 'badge-green';
  if (tipo === 'ACESSO_PAINEL_ADMIN') return 'badge-magenta';
  return 'badge-blue';
}

function badgeStatus(status) {
  if (status == null) return 'badge-gray';
  if (status >= 500) return 'badge-red';
  if (status >= 400) return 'badge-amber';
  return 'badge-green';
}

const formatarDataHora = (data) => formatarDataHoraBase(data, { comAno: true, comSegundos: true });

const FILTROS_VAZIOS = { usuarioEmail: '', dataInicial: '', dataFinal: '', tipoEvento: '', rota: '', role: '', status: '' };

export default function AuditoriaAdmin() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [tiposEvento, setTiposEvento] = useState([]);
  const [filtrosForm, setFiltrosForm] = useState(FILTROS_VAZIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState({ content: [], totalPages: 0, totalElements: 0 });

  useEffect(() => {
    api.get('/admin/auditoria/tipos-evento').then(r => setTiposEvento(r.data)).catch(() => setTiposEvento([]));
  }, []);

  const paramsFiltro = {
    usuarioEmail: filtrosAplicados.usuarioEmail || undefined,
    dataInicial: filtrosAplicados.dataInicial || undefined,
    dataFinal: filtrosAplicados.dataFinal || undefined,
    tipoEvento: filtrosAplicados.tipoEvento || undefined,
    rota: filtrosAplicados.rota || undefined,
    role: filtrosAplicados.role || undefined,
    status: filtrosAplicados.status || undefined,
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    try {
      const { data } = await api.get('/admin/auditoria', { params: { ...paramsFiltro, page: pagina, size: 20 } });
      setDados(data);
    } catch {
      setDados({ content: [], totalPages: 0, totalElements: 0 });
      setErro(true);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAplicados, pagina]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAplicarFiltros = (e) => {
    e.preventDefault();
    setPagina(0);
    setFiltrosAplicados(filtrosForm);
  };

  const handleLimparFiltros = () => {
    setFiltrosForm(FILTROS_VAZIOS);
    setFiltrosAplicados(FILTROS_VAZIOS);
    setPagina(0);
  };

  const handleExportarCsv = async () => {
    setExportando(true);
    try {
      const resp = await api.get('/admin/auditoria/exportar.csv', { params: paramsFiltro, responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'auditoria.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar', 'Não foi possível gerar o CSV. Tente novamente.');
    } finally { setExportando(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <form className="card no-print" style={{ padding: 20 }} onSubmit={handleAplicarFiltros}>
        <div className="filtros-bar" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Usuário (e-mail)</label>
            <input className="form-control" placeholder="nome@exemplo.com" value={filtrosForm.usuarioEmail}
              onChange={e => setFiltrosForm(f => ({ ...f, usuarioEmail: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Data inicial</label>
            <input className="form-control" type="date" value={filtrosForm.dataInicial}
              onChange={e => setFiltrosForm(f => ({ ...f, dataInicial: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Data final</label>
            <input className="form-control" type="date" value={filtrosForm.dataFinal}
              onChange={e => setFiltrosForm(f => ({ ...f, dataFinal: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de evento</label>
            <select className="form-control" value={filtrosForm.tipoEvento}
              onChange={e => setFiltrosForm(f => ({ ...f, tipoEvento: e.target.value }))}>
              <option value="">Todos</option>
              {tiposEvento.map(t => <option key={t} value={t}>{TIPO_EVENTO_LABEL[t] || t}</option>)}
            </select>
          </div>
        </div>
        <div className="filtros-bar">
          <div className="form-group">
            <label className="form-label">Endpoint</label>
            <input className="form-control" placeholder="/estadias" value={filtrosForm.rota}
              onChange={e => setFiltrosForm(f => ({ ...f, rota: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={filtrosForm.role}
              onChange={e => setFiltrosForm(f => ({ ...f, role: e.target.value }))}>
              <option value="">Todas</option>
              <option value="ADMIN">Administrador</option>
              <option value="OPERADOR">Operador</option>
              <option value="USER">Motorista</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status HTTP</label>
            <input className="form-control" type="number" placeholder="Ex: 200" value={filtrosForm.status}
              onChange={e => setFiltrosForm(f => ({ ...f, status: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" style={{ height: 44 }}>
              <Icon name="search" size={15} /> Pesquisar
            </button>
            <button className="btn btn-ghost" type="button" style={{ height: 44 }} onClick={handleLimparFiltros}>
              Limpar
            </button>
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: 24 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Registros de auditoria</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!loading && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginRight: 4 }}>{dados.totalElements} registros</span>}
            <button className="btn btn-ghost btn-sm" onClick={handleExportarCsv} disabled={exportando}>
              {exportando ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Icon name="download" size={14} />} CSV
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Icon name="print" size={14} /> Imprimir / PDF
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonTable linhas={8} colunas={6} />
        ) : erro ? (
          <EstadoErro mensagem="Não foi possível carregar os registros de auditoria." onTentarNovamente={carregar} />
        ) : dados.content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="list" size={32} /></div>
            <h3>Nenhum registro encontrado</h3>
            <p>Ajuste os filtros e tente novamente.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Usuário</th>
                    <th className="hide-mobile">Role</th>
                    <th>Evento</th>
                    <th className="hide-mobile">Endpoint</th>
                    <th>Status</th>
                    <th className="hide-mobile">IP</th>
                    <th className="hide-mobile">Navegador / SO</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.content.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatarDataHora(log.dataHora)}</td>
                      <td style={{ fontSize: '.85rem' }}>{log.usuarioEmail || <span style={{ color: 'var(--text-muted)' }}>anônimo</span>}</td>
                      <td className="hide-mobile">{log.role ? <span className="badge badge-gray">{ROLE_LABEL[log.role] || log.role}</span> : '—'}</td>
                      <td>
                        <span className={`badge ${badgeTipoEvento(log.tipoEvento)}`} title={log.descricao} data-tip={log.descricao}>
                          {TIPO_EVENTO_LABEL[log.tipoEvento] || log.tipoEvento}
                        </span>
                      </td>
                      <td className="hide-mobile" style={{ fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {log.metodo} {log.rota}
                      </td>
                      <td><span className={`badge ${badgeStatus(log.status)}`}>{log.status ?? '—'}</span></td>
                      <td className="hide-mobile" style={{ fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
                      <td className="hide-mobile" style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                        {[log.navegador, log.sistemaOperacional].filter(Boolean).join(' / ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="no-print">
              <Paginacao pagina={dados.number ?? pagina} totalPaginas={dados.totalPages} totalElementos={dados.totalElements} onMudarPagina={setPagina} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
