import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import PainelLayout from '../components/PainelLayout';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const mkVerde = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const mkVermelho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, 14); }, [pos]);
  return null;
}

const NAV = [{
  label: 'Motorista',
  items: [
    { id: 'estadia',   icon: '⏱️', label: 'Minha estadia' },
    { id: 'mapa',      icon: '📍', label: 'Buscar vagas' },
    { id: 'veiculos',  icon: '🚗', label: 'Meus veículos' },
    { id: 'historico', icon: '📋', label: 'Histórico' },
  ],
}];

const tiposIcon = { CARRO: '🚗', MOTO: '🏍️', CAMINHONETE: '🛻' };

/* ── Modal reserva ── */
function ModalReserva({ est, vagas, onConfirm, onClose }) {
  const [vagaId, setVagaId] = useState('');
  const livres = vagas.filter(v => !v.ocupada && v.ativo !== false);
  useEffect(() => { if (livres.length > 0) setVagaId(String(livres[0].id)); }, [vagas]);

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
            <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>📍 {est.endereco}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-green">{livres.length} vagas livres</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
            </div>
          </div>
          {livres.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--red)', padding: '12px 0' }}>Sem vagas disponíveis no momento.</p>
          ) : (
            <form id="form-reserva" onSubmit={e => { e.preventDefault(); onConfirm(est, vagaId); }}>
              <div className="form-group">
                <label className="form-label">Selecionar vaga</label>
                <select className="form-control" value={vagaId} onChange={e => setVagaId(e.target.value)}>
                  {livres.map(v => <option key={v.id} value={v.id}>Vaga {v.codigo}</option>)}
                </select>
              </div>
            </form>
          )}
          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Após confirmar, você receberá um código. Apresente ao operador ao chegar.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {livres.length > 0 && <button className="btn btn-primary" form="form-reserva" type="submit">Confirmar reserva</button>}
        </div>
      </div>
    </div>
  );
}

/* ── Modal código ── */
function ModalCodigo({ reserva, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Código de check-in</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>
            Mostre este código ao operador ao chegar em:
          </p>
          <p style={{ fontWeight: 600 }}>{reserva.estacionamentoNome}</p>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 700,
            letterSpacing: '8px', color: 'var(--blue-light)', padding: '20px 16px',
            background: 'var(--bg-surface)', borderRadius: 12, border: '2px dashed var(--blue)',
            wordBreak: 'break-all',
          }}>
            {reserva.codigo}
          </div>
          <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'left' }}>
            <p style={{ fontSize: '.82rem', color: 'var(--green)', lineHeight: 1.65 }}>
              ✓ Reserva confirmada para a <strong>Vaga {reserva.vagaCodigo}</strong><br />
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

/* ── Principal ── */
export default function PainelMotorista() {
  const location = useLocation();
  const [aba, setAba] = useState(location.state?.aba || 'estadia');
  const [userPos, setUserPos] = useState(null);
  const [estadiaAtiva, setEstadiaAtiva] = useState(null);
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [historicoEstadias, setHistoricoEstadias] = useState([]);
  const [vagasEstac, setVagasEstac] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [modalReserva, setModalReserva] = useState(null);
  const [modalCodigo, setModalCodigo] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formV, setFormV] = useState({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });

  const toast = useToast();

  useEffect(() => {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        p => setUserPos([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
  }, []);

  const buscarDados = useCallback(async () => {
    try {
      const [vR, eR] = await Promise.all([api.get('/veiculos/meus'), api.get('/estacionamentos')]);
      setVeiculos(vR.data);
      setEstacionamentos(eR.data);
    } catch {}
  }, []);

  const buscarEstadia = useCallback(async () => {
    try {
      const { data } = await api.get('/estadias/minha-ativa');
      setEstadiaAtiva(data);
    } catch { setEstadiaAtiva(null); }
  }, []);

  const buscarHistorico = useCallback(async () => {
    try {
      const { data } = await api.get('/estadias/meu-historico');
      setHistoricoEstadias(data);
    } catch { setHistoricoEstadias([]); }
  }, []);

  useEffect(() => {
    Promise.all([buscarDados(), buscarEstadia()]).finally(() => setLoadingInit(false));
    const t = setInterval(buscarEstadia, 30000);
    return () => clearInterval(t);
  }, [buscarDados, buscarEstadia]);

  useEffect(() => { if (aba === 'historico') buscarHistorico(); }, [aba, buscarHistorico]);

  const abrirReserva = async (est) => {
    try {
      const { data } = await api.get('/vagas', { params: { estacionamentoId: est.id } });
      setVagasEstac(data);
    } catch { setVagasEstac([]); }
    setModalReserva(est);
  };

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

  const handleAddVeiculo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/veiculos', { ...formV, placa: formV.placa.toUpperCase(), ativo: true });
      toast.success('Veículo cadastrado!', formV.placa.toUpperCase());
      setFormV({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });
      setMostrarForm(false);
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
    } catch { toast.error('Erro', 'Não foi possível remover.'); }
  };

  const valorAtual = () => {
    if (!estadiaAtiva?.entrada) return 0;
    const vh = estadiaAtiva.vaga?.estacionamento?.valorHora || 0;
    return Math.max((Date.now() - new Date(estadiaAtiva.entrada).getTime()) / 3600000, 1) * vh;
  };

  if (loadingInit) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span>Carregando...</span>
    </div>
  );

  const mapCenter = userPos || [-15.78, -47.93];
  const topbarTitles = {
    estadia: 'Minha estadia',
    mapa: 'Buscar vagas',
    veiculos: 'Meus veículos',
    historico: 'Histórico',
  };

  return (
    <>
      <PainelLayout
        aba={aba} setAba={setAba} itens={NAV}
        topbarTitle={topbarTitles[aba]}
        semPadding={aba === 'mapa'}
      >

        {/* ══ MAPA — sempre montado, oculto nas outras abas ══ */}
        <div style={{ display: aba === 'mapa' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <MapContainer
            center={mapCenter}
            zoom={userPos ? 14 : 5}
            style={{ flex: 1, minHeight: 0 }}
          >
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
                  icon={livres > 0 ? mkVerde : mkVermelho}>
                  <Popup>
                    <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 185 }}>
                      <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>{est.nome}</strong>
                      <div style={{ fontSize: '.8rem', color: '#64748b', marginBottom: 8 }}>{est.endereco}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ fontSize: '.8rem' }}>{livres > 0 ? `🟢 ${livres} livres` : '🔴 Lotado'}</span>
                        <span style={{ fontSize: '.8rem', color: '#10b981', fontWeight: 700 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
                      </div>
                      <button
                        onClick={() => abrirReserva(est)}
                        disabled={livres === 0}
                        style={{ width: '100%', padding: '7px', background: livres > 0 ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, cursor: livres > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '.85rem', fontFamily: 'Inter,sans-serif' }}>
                        {livres > 0 ? 'Reservar vaga' : 'Sem vagas'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* ══ DEMAIS ABAS — com padding normal ══ */}
        {aba !== 'mapa' && (
          <div className="painel-abas-wrap">

            {/* ESTADIA */}
            {aba === 'estadia' && (
              <div className="estadia-wrap">
                {estadiaAtiva ? (
                  <>
                    <div className="ticket">
                      <div className="ticket-head">
                        <div className="ticket-head-label">Estacionando em</div>
                        <div className="ticket-head-name">{estadiaAtiva.vaga?.estacionamento?.nome || 'SmartPark'}</div>
                        <div className="ticket-head-addr">{estadiaAtiva.vaga?.estacionamento?.endereco}</div>
                      </div>
                      <div className="ticket-price">
                        <div className="ticket-price-label">Valor acumulado</div>
                        <div className="ticket-price-value">R$ {valorAtual().toFixed(2)}</div>
                        <div className="ticket-price-rate">
                          R$ {estadiaAtiva.vaga?.estacionamento?.valorHora?.toFixed(2)}/hora · cobrado por hora cheia
                        </div>
                      </div>
                      <div className="ticket-info">
                        <div>
                          <div className="ticket-info-label">VEÍCULO</div>
                          <div className="placa-badge" style={{ fontSize: '1rem' }}>{estadiaAtiva.veiculo?.placa}</div>
                          <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{estadiaAtiva.veiculo?.modelo}</div>
                        </div>
                        <div className="ticket-info-right">
                          <div className="ticket-info-label">VAGA</div>
                          <span className="badge badge-blue" style={{ fontSize: '.88rem', padding: '5px 14px' }}>
                            {estadiaAtiva.vaga?.codigo ? `Vaga ${estadiaAtiva.vaga.codigo}` : `ID ${estadiaAtiva.vaga?.id}`}
                          </span>
                        </div>
                      </div>
                      <div className="ticket-time">
                        <span className="ticket-time-label">🕐 Hora de entrada</span>
                        <strong className="ticket-time-value">
                          {estadiaAtiva.entrada
                            ? new Date(estadiaAtiva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </strong>
                      </div>
                      <div className="ticket-foot">🛡️ Estadia ativa e monitorada pelo SmartPark</div>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 12, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                      Valor atualizado a cada 30 segundos
                    </p>
                  </>
                ) : (
                  <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🅿</div>
                    <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Nenhuma estadia ativa</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                      Você não está estacionado agora.<br />
                      Reserve uma vaga ou aguarde o operador registrar sua entrada.
                    </p>
                    <button className="btn btn-primary" onClick={() => setAba('mapa')}>
                      📍 Buscar vagas
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VEÍCULOS */}
            {aba === 'veiculos' && (
              <div style={{ maxWidth: 640 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                    <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Minha frota</h2>
                    <button className={`btn btn-sm ${mostrarForm ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => setMostrarForm(f => !f)}>
                      {mostrarForm ? '✕ Cancelar' : '+ Adicionar veículo'}
                    </button>
                  </div>

                  {mostrarForm && (
                    <form onSubmit={handleAddVeiculo}
                      style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 18, marginBottom: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="veiculo-form-grid">
                        <div className="form-group">
                          <label className="form-label">Placa</label>
                          <input className="form-control placa" placeholder="ABC1234"
                            value={formV.placa} onChange={e => setFormV(f => ({ ...f, placa: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tipo</label>
                          <select className="form-control" value={formV.tipo} onChange={e => setFormV(f => ({ ...f, tipo: e.target.value }))}>
                            <option value="CARRO">🚗 Carro</option>
                            <option value="MOTO">🏍️ Moto</option>
                            <option value="CAMINHONETE">🛻 Caminhonete</option>
                          </select>
                        </div>
                        <div className="form-group span2">
                          <label className="form-label">Modelo</label>
                          <input className="form-control" placeholder="Ex: Honda Civic"
                            value={formV.modelo} onChange={e => setFormV(f => ({ ...f, modelo: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Cor</label>
                          <input className="form-control" placeholder="Ex: Prata"
                            value={formV.cor} onChange={e => setFormV(f => ({ ...f, cor: e.target.value }))} required />
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
                        <div key={v.id} className="veiculo-item">
                          <div className="veiculo-item-left">
                            <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{tiposIcon[v.tipo] || '🚗'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div className="placa-badge" style={{ marginBottom: 4 }}>{v.placa}</div>
                              <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{v.modelo} · {v.cor}</div>
                              <span className="badge badge-gray" style={{ marginTop: 4, fontSize: '.7rem' }}>{v.tipo}</span>
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => handleRemoverVeiculo(v.id, v.placa)}
                            style={{ color: 'var(--red)', borderColor: 'var(--red)', flexShrink: 0 }}>
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HISTÓRICO */}
            {aba === 'historico' && (
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
                          <th className="hide-mobile">Duração</th>
                          <th style={{ textAlign: 'right' }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoEstadias.map(h => {
                          const dur = h.entrada && h.saida
                            ? Math.round((new Date(h.saida) - new Date(h.entrada)) / 60000) : null;
                          return (
                            <tr key={h.id}>
                              <td>
                                <div style={{ fontWeight: 500, fontSize: '.9rem' }}>{h.vaga?.estacionamento?.nome || 'SmartPark'}</div>
                                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Vaga {h.vaga?.codigo}</div>
                              </td>
                              <td><span className="placa-badge" style={{ fontSize: '.82rem' }}>{h.veiculo?.placa}</span></td>
                              <td style={{ fontSize: '.83rem', color: 'var(--text-secondary)' }}>
                                {h.entrada ? new Date(h.entrada).toLocaleDateString('pt-BR') : '--'}
                              </td>
                              <td className="hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '.83rem' }}>
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
            )}

          </div>
        )}

      </PainelLayout>

      {modalReserva && (
        <ModalReserva
          est={modalReserva} vagas={vagasEstac}
          onConfirm={confirmarReserva} onClose={() => setModalReserva(null)}
        />
      )}
      {modalCodigo && (
        <ModalCodigo reserva={modalCodigo} onClose={() => setModalCodigo(null)} />
      )}

      <style>{`
        .painel-abas-wrap { padding: 24px 28px; }
        .estadia-wrap { max-width: 520px; margin: 0 auto; }
        .hide-mobile { }
        @media (max-width: 768px) {
          .painel-abas-wrap { padding: 16px; }
          .estadia-wrap { max-width: 100%; }
        }
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </>
  );
}