import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PainelLayout from '../components/PainelLayout';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const markerVerde = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const markerVermelho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, 14); }, [pos]);
  return null;
}

const NAV = [
  {
    label: 'Motorista',
    items: [
      { id: 'estadia',   icon: '⏱️', label: 'Minha estadia' },
      { id: 'mapa',      icon: '📍', label: 'Buscar vagas' },
      { id: 'veiculos',  icon: '🚗', label: 'Meus veículos' },
      { id: 'historico', icon: '📋', label: 'Histórico' },
    ]
  }
];

/* Modal de reserva */
function ModalReserva({ est, vagas, onConfirm, onClose }) {
  const [vagaId, setVagaId] = useState('');
  const vagasLivres = vagas.filter(v => !v.ocupada && v.ativo !== false);

  useEffect(() => {
    if (vagasLivres.length > 0) setVagaId(vagasLivres[0].id);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vagaId) return;
    onConfirm(est, vagaId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reservar vaga</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{est.nome}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {est.endereco}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
              <span className="badge badge-green">{vagasLivres.length} vagas livres</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
            </div>
          </div>

          {vagasLivres.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--red)', padding: '16px 0' }}>Sem vagas disponíveis no momento.</div>
          ) : (
            <form id="form-reserva" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Selecionar vaga</label>
                <select className="form-control" value={vagaId} onChange={e => setVagaId(e.target.value)}>
                  {vagasLivres.map(v => <option key={v.id} value={v.id}>Vaga {v.codigo}</option>)}
                </select>
              </div>
            </form>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Após confirmar, você receberá um código. Apresente ao operador ao chegar.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {vagasLivres.length > 0 && (
            <button className="btn btn-primary" form="form-reserva" type="submit">
              Confirmar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Modal de código de check-in */
function ModalCodigo({ reserva, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Seu código de check-in</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Mostre este código ao operador ao chegar em:
          </p>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reserva.estacionamentoNome}</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700,
            letterSpacing: '8px', color: 'var(--blue-light)', padding: '20px',
            background: 'var(--bg-surface)', borderRadius: 12,
            border: '2px dashed var(--blue)',
          }}>
            {reserva.codigo}
          </div>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '12px 16px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--green)', lineHeight: 1.6 }}>
              ✓ Reserva confirmada para a <strong>Vaga {reserva.vagaCodigo}</strong><br/>
              Dirija-se ao estacionamento e apresente o código acima.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-full" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

export default function PainelMotorista() {
  const location = useLocation();
  const [aba, setAba] = useState(location.state?.aba || 'estadia');
  const [userPos, setUserPos] = useState(null);

  // Dados
  const [estadiaAtiva, setEstadiaAtiva] = useState(null);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [historicoEstadias, setHistoricoEstadias] = useState([]);
  const [vagasEstac, setVagasEstac] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // UI
  const [modalReserva, setModalReserva] = useState(null);
  const [modalCodigo, setModalCodigo] = useState(null);
  const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);
  const [formVeiculo, setFormVeiculo] = useState({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  /* ── Geolocalização ── */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserPos([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
  }, []);

  /* ── Carregar dados iniciais ── */
  const buscarDados = useCallback(async () => {
    try {
      const [veicR, estacR] = await Promise.all([
        api.get('/veiculos/meus'),
        api.get('/estacionamentos'),
      ]);
      setVeiculos(veicR.data);
      setEstacionamentos(estacR.data);
    } catch { }
  }, []);

  const buscarEstadia = useCallback(async () => {
    try {
      const { data } = await api.get('/estadias/minha-ativa');
      setEstadiaAtiva(data);
    } catch {
      setEstadiaAtiva(null);
    }
  }, []);

  const buscarHistorico = useCallback(async () => {
    try {
      const { data } = await api.get('/estadias/meu-historico');
      setHistoricoEstadias(data);
    } catch { setHistoricoEstadias([]); }
  }, []);

  useEffect(() => {
    Promise.all([buscarDados(), buscarEstadia()]).finally(() => setLoadingInit(false));
    const interval = setInterval(buscarEstadia, 30000);
    return () => clearInterval(interval);
  }, [buscarDados, buscarEstadia]);

  useEffect(() => {
    if (aba === 'historico') buscarHistorico();
  }, [aba, buscarHistorico]);

  /* ── Abrir modal de reserva ── */
  const abrirReserva = async (est) => {
    try {
      const { data } = await api.get('/vagas', { params: { estacionamentoId: est.id } });
      setVagasEstac(data);
      setModalReserva(est);
    } catch {
      // fallback: vagas vazias
      setVagasEstac([]);
      setModalReserva(est);
    }
  };

  /* ── Confirmar reserva ── */
  const confirmarReserva = async (est, vagaId) => {
    try {
      const vaga = vagasEstac.find(v => String(v.id) === String(vagaId));
      const { data } = await api.post('/reservas', { estacionamentoId: est.id, vagaId });
      setModalReserva(null);
      setModalCodigo({
        codigo: data.codigo || data.codigoCheckin || 'N/A',
        estacionamentoNome: est.nome,
        vagaCodigo: vaga?.codigo || vagaId,
      });
      toast.success('Reserva confirmada!', `Código gerado para ${est.nome}`);
    } catch (err) {
      toast.error('Erro na reserva', err.response?.data?.message || 'Tente novamente.');
    }
  };

  /* ── Veículos ── */
  const handleAddVeiculo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/veiculos', { ...formVeiculo, placa: formVeiculo.placa.toUpperCase(), ativo: true });
      toast.success('Veículo cadastrado!', formVeiculo.placa.toUpperCase());
      setFormVeiculo({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });
      setMostrarFormVeiculo(false);
      buscarDados();
    } catch (err) {
      toast.error('Erro', err.response?.data?.message || 'Placa pode já estar cadastrada.');
    }
  };

  const handleRemoverVeiculo = async (id, placa) => {
    if (!window.confirm(`Remover veículo ${placa}?`)) return;
    try {
      await api.delete(`/veiculos/${id}`);
      toast.success('Veículo removido', placa);
      buscarDados();
    } catch {
      toast.error('Erro', 'Não foi possível remover.');
    }
  };

  /* ── Valor acumulado da estadia ── */
  const valorAtual = () => {
    if (!estadiaAtiva?.entrada) return 0;
    const valorHora = estadiaAtiva.vaga?.estacionamento?.valorHora || 0;
    const horas = Math.max((Date.now() - new Date(estadiaAtiva.entrada).getTime()) / 3600000, 1);
    return horas * valorHora;
  };

  if (loadingInit) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span>Carregando...</span>
    </div>
  );

  const mapCenter = userPos || [-15.78, -47.93];
  const topbarTitles = { estadia: 'Minha estadia', mapa: 'Buscar vagas', veiculos: 'Meus veículos', historico: 'Histórico' };
  const tiposIcon = { CARRO: '🚗', MOTO: '🏍️', CAMINHONETE: '🛻' };

  return (
    <>
      <PainelLayout
        aba={aba} setAba={setAba} itens={NAV}
        topbarTitle={topbarTitles[aba]}
      >

        {/* ══ ESTADIA ══ */}
        {aba === 'estadia' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {estadiaAtiva ? (
              <div>
                {/* Ticket */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  {/* Cabeçalho verde */}
                  <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '20px 24px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Estacionando em</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                      {estadiaAtiva.vaga?.estacionamento?.nome || 'SmartPark'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                      {estadiaAtiva.vaga?.estacionamento?.endereco}
                    </div>
                  </div>

                  {/* Valor */}
                  <div style={{ padding: '28px 24px', textAlign: 'center', borderBottom: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor acumulado</div>
                    <div style={{ fontSize: '3.2rem', fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>
                      R$ {valorAtual().toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      R$ {estadiaAtiva.vaga?.estacionamento?.valorHora?.toFixed(2)}/hora · cobrado por hora cheia
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>VEÍCULO</div>
                      <div className="placa-badge" style={{ fontSize: '1rem' }}>{estadiaAtiva.veiculo?.placa}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{estadiaAtiva.veiculo?.modelo}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>VAGA</div>
                      <span className="badge badge-blue" style={{ fontSize: '0.9rem', padding: '5px 14px' }}>
                        {estadiaAtiva.vaga?.codigo ? `Vaga ${estadiaAtiva.vaga.codigo}` : `ID ${estadiaAtiva.vaga?.id}`}
                      </span>
                    </div>
                    <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 8, marginTop: 4 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🕐 Entrada</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {estadiaAtiva.entrada
                          ? new Date(estadiaAtiva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </strong>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div style={{ padding: '14px 24px', background: 'rgba(16,185,129,0.06)', borderTop: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--green)', fontSize: '0.8rem' }}>🛡️ Estadia ativa e monitorada pelo SmartPark</span>
                  </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Valor atualizado a cada 30 segundos automaticamente
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🅿</div>
                <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Nenhuma estadia ativa</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                  Você não está estacionado em nenhum lugar agora.<br />
                  Reserve uma vaga ou aguarde o operador registrar sua entrada.
                </p>
                <button className="btn btn-primary" onClick={() => setAba('mapa')}>
                  📍 Buscar vagas próximas
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ MAPA ══ */}
        {aba === 'mapa' && (
          <div>
            <div style={{ height: 'calc(100vh - 140px)', minHeight: 400, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapContainer center={mapCenter} zoom={userPos ? 14 : 5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                {userPos && <RecenterMap pos={userPos} />}
                {estacionamentos.map(est => {
                  if (!est.latitude || !est.longitude) return null;
                  const livres = Math.max(0, est.vagasTotais - (est.vagasOcupadas || 0));
                  return (
                    <Marker key={est.id} position={[est.latitude, est.longitude]}
                      icon={livres > 0 ? markerVerde : markerVermelho}>
                      <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 190 }}>
                          <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>{est.nome}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>{est.endereco}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: '0.8rem' }}>{livres > 0 ? `🟢 ${livres} livres` : '🔴 Lotado'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
                          </div>
                          <button
                            onClick={() => abrirReserva(est)}
                            disabled={livres === 0}
                            style={{ width: '100%', padding: '7px', background: livres > 0 ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: 6, cursor: livres > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.85rem' }}
                          >
                            {livres > 0 ? 'Reservar vaga' : 'Sem vagas'}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* ══ VEÍCULOS ══ */}
        {aba === 'veiculos' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Minha frota</h2>
                <button className={`btn btn-sm ${mostrarFormVeiculo ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => setMostrarFormVeiculo(f => !f)}>
                  {mostrarFormVeiculo ? '✕ Cancelar' : '+ Adicionar veículo'}
                </button>
              </div>

              {mostrarFormVeiculo && (
                <form onSubmit={handleAddVeiculo} style={{
                  background: 'var(--bg-surface)', borderRadius: 10, padding: 20,
                  marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Placa</label>
                      <input className="form-control placa" placeholder="ABC1234"
                        value={formVeiculo.placa} onChange={e => setFormVeiculo(f => ({ ...f, placa: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo</label>
                      <select className="form-control" value={formVeiculo.tipo}
                        onChange={e => setFormVeiculo(f => ({ ...f, tipo: e.target.value }))}>
                        <option value="CARRO">🚗 Carro</option>
                        <option value="MOTO">🏍️ Moto</option>
                        <option value="CAMINHONETE">🛻 Caminhonete</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Modelo</label>
                      <input className="form-control" placeholder="Ex: Honda Civic"
                        value={formVeiculo.modelo} onChange={e => setFormVeiculo(f => ({ ...f, modelo: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cor</label>
                      <input className="form-control" placeholder="Ex: Prata"
                        value={formVeiculo.cor} onChange={e => setFormVeiculo(f => ({ ...f, cor: e.target.value }))} required />
                    </div>
                  </div>
                  <button className="btn btn-success btn-full" type="submit">Salvar veículo</button>
                </form>
              )}

              {veiculos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🚗</div>
                  <h3>Nenhum veículo cadastrado</h3>
                  <p>Adicione um veículo para fazer reservas</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {veiculos.map(v => (
                    <div key={v.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10,
                      background: 'var(--bg-surface)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: '1.6rem' }}>{tiposIcon[v.tipo] || '🚗'}</span>
                        <div>
                          <div className="placa-badge" style={{ marginBottom: 4 }}>{v.placa}</div>
                          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{v.modelo} · {v.cor}</div>
                          <span className="badge badge-gray" style={{ marginTop: 4, fontSize: '0.7rem' }}>{v.tipo}</span>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemoverVeiculo(v.id, v.placa)}
                        style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ HISTÓRICO ══ */}
        {aba === 'historico' && (
          <div>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>Minhas estadias</h2>
              {historicoEstadias.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>Nenhuma estadia ainda</h3>
                  <p>Seu histórico de estacionamentos aparecerá aqui</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Local</th>
                        <th>Veículo</th>
                        <th>Data</th>
                        <th>Duração</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoEstadias.map(h => {
                        const dur = h.entrada && h.saida
                          ? Math.round((new Date(h.saida) - new Date(h.entrada)) / 60000)
                          : null;
                        return (
                          <tr key={h.id}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{h.vaga?.estacionamento?.nome || 'SmartPark'}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vaga {h.vaga?.codigo}</div>
                            </td>
                            <td><span className="placa-badge" style={{ fontSize: '0.83rem' }}>{h.veiculo?.placa}</span></td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {h.entrada ? new Date(h.entrada).toLocaleDateString('pt-BR') : '--'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {dur ? `${Math.floor(dur / 60)}h ${dur % 60}min` : '—'}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>
                              R$ {h.valor?.toFixed(2) || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </PainelLayout>

      {/* Modais */}
      {modalReserva && (
        <ModalReserva
          est={modalReserva}
          vagas={vagasEstac}
          onConfirm={confirmarReserva}
          onClose={() => setModalReserva(null)}
        />
      )}
      {modalCodigo && (
        <ModalCodigo
          reserva={modalCodigo}
          onClose={() => setModalCodigo(null)}
        />
      )}
    </>
  );
}
