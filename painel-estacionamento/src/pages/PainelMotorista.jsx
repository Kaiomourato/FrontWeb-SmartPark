import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErroMsg } from '../utils/erro';
import PainelLayout from '../components/PainelLayout';
import ModalConfirm from '../components/ModalConfirm';
import Icon from '../components/Icon';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function criarPin(cor) {
  return L.divIcon({
    className: 'map-pin',
    html: `<span class="map-pin-dot" style="background:${cor}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}
const mkVerde = criarPin('#10b981');
const mkVermelho = criarPin('#ef4444');

function RecenterMap({ pos, zoom = 14 }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, zoom); }, [pos, zoom]);
  return null;
}

// Corrige o tamanho do mapa quando ele sai de display:none (troca de aba)
function MapResize({ ativo }) {
  const map = useMap();
  useEffect(() => {
    if (!ativo) return;
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [ativo, map]);
  return null;
}

const NAV = [{
  label: 'Motorista',
  items: [
    { id: 'estadia',   icon: <Icon name="clock" size={18} />,   label: 'Minha estadia' },
    { id: 'mapa',      icon: <Icon name="pin" size={18} />,     label: 'Buscar vagas' },
    { id: 'veiculos',  icon: <Icon name="car" size={18} />,     label: 'Meus veículos' },
    { id: 'historico', icon: <Icon name="list" size={18} />,    label: 'Histórico' },
  ],
}];

const tiposIcon = { CARRO: 'car', MOTO: 'moto', CAMINHONETE: 'truck' };

/* ── Modal reserva ── */
function ModalReserva({ est, vagas, veiculos, onConfirm, onClose, onIrParaVeiculos, enviando }) {
  const [veiculoId, setVeiculoId] = useState('');
  const [vagaId, setVagaId] = useState('');
  const [previsaoChegada, setPrevisaoChegada] = useState('');

  useEffect(() => {
    if (veiculos.length > 0) setVeiculoId(String(veiculos[0].id));
  }, [veiculos]);

  const semVeiculos = veiculos.length === 0;
  const veiculoSel = veiculos.find(v => String(v.id) === String(veiculoId));
  const todasLivres = vagas.filter(v => !v.ocupada && v.ativo !== false);
  const compativeis = todasLivres.filter(v => !v.tipoVeiculo || !veiculoSel || v.tipoVeiculo === veiculoSel.tipo);

  useEffect(() => {
    setVagaId(compativeis.length > 0 ? String(compativeis[0].id) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vagas, veiculoId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reservar vaga</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{est.nome}</div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="pin" size={13} /> {est.endereco}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-green">{todasLivres.length} vagas livres</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
            </div>
          </div>

          {semVeiculos ? (
            <div className="empty-state" style={{ padding: '12px 0' }}>
              <div className="empty-state-icon"><Icon name="car" size={32} /></div>
              <h3>Nenhum veículo cadastrado</h3>
              <p>Cadastre um veículo para reservar uma vaga.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={onIrParaVeiculos}>
                + Adicionar veículo
              </button>
            </div>
          ) : (
            <form id="form-reserva" onSubmit={e => { e.preventDefault(); onConfirm(est, vagaId, veiculoId, previsaoChegada); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Veículo</label>
                <select className="form-control" value={veiculoId} onChange={e => setVeiculoId(e.target.value)}>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.placa} · {v.modelo}
                    </option>
                  ))}
                </select>
              </div>

              {compativeis.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--red)', padding: '4px 0', fontSize: '.85rem' }}>
                  Nenhuma vaga livre compatível com este veículo no momento.
                </p>
              ) : (
                <div className="form-group">
                  <label className="form-label">Selecionar vaga</label>
                  <select className="form-control" value={vagaId} onChange={e => setVagaId(e.target.value)}>
                    {compativeis.map(v => <option key={v.id} value={v.id}>Vaga {v.codigo}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Previsão de chegada (opcional)</label>
                <input type="datetime-local" className="form-control"
                  value={previsaoChegada} onChange={e => setPrevisaoChegada(e.target.value)} />
              </div>
            </form>
          )}

          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Após confirmar, você receberá um código. Apresente ao operador ao chegar.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={enviando}>Cancelar</button>
          {!semVeiculos && compativeis.length > 0 && (
            <button className="btn btn-primary" form="form-reserva" type="submit" disabled={enviando}>
              {enviando
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Confirmando...</>
                : 'Confirmar reserva'}
            </button>
          )}
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
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>
            Mostre este código ao operador ao chegar em:
          </p>
          <p style={{ fontWeight: 600 }}>{reserva.estacionamentoNome}</p>
          <div className="codigo-display">{reserva.codigo}</div>
          <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'left', display: 'flex', gap: 10 }}>
            <span style={{ color: 'var(--green)', flexShrink: 0 }}><Icon name="check" size={16} /></span>
            <p style={{ fontSize: '.82rem', color: 'var(--green)', lineHeight: 1.65 }}>
              Reserva confirmada para a <strong>Vaga {reserva.vagaCodigo}</strong><br />
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
  const [filtroMapa, setFiltroMapa] = useState('');
  const [somenteLivres, setSomenteLivres] = useState(false);
  const [precoMax, setPrecoMax] = useState('');
  const [tipoVeiculoFiltro, setTipoVeiculoFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('');
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);
  const [favoritoIds, setFavoritoIds] = useState(new Set());
  const [selecionado, setSelecionado] = useState(null);
  const [modalReserva, setModalReserva] = useState(null);
  const [modalCodigo, setModalCodigo] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formV, setFormV] = useState({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });
  const [enviandoReserva, setEnviandoReserva] = useState(false);
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  const [removendoVeiculoId, setRemovendoVeiculoId] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [agora, setAgora] = useState(null);

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
      const [vR, eR, fR] = await Promise.all([
        api.get('/veiculos/meus'), api.get('/estacionamentos'), api.get('/favoritos/meus'),
      ]);
      setVeiculos(vR.data);
      setEstacionamentos(eR.data);
      setFavoritoIds(new Set(fR.data.map(e => e.id)));
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

  // Relógio local de 1s para o valor "ao vivo" e a contagem até a próxima hora
  // cheia — sem isso, o valor só mudaria a cada 30s (intervalo de buscarEstadia).
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (aba === 'historico') buscarHistorico(); }, [aba, buscarHistorico]);

  const toggleFavorito = async (estId) => {
    const jaFavorito = favoritoIds.has(estId);
    setFavoritoIds(prev => {
      const next = new Set(prev);
      if (jaFavorito) next.delete(estId); else next.add(estId);
      return next;
    });
    try {
      if (jaFavorito) await api.delete(`/favoritos/${estId}`);
      else await api.post(`/favoritos/${estId}`);
    } catch {
      // Reverte a mudança otimista se a chamada falhar
      setFavoritoIds(prev => {
        const next = new Set(prev);
        if (jaFavorito) next.add(estId); else next.delete(estId);
        return next;
      });
      toast.error('Erro', 'Não foi possível atualizar o favorito.');
    }
  };

  const limparFiltros = () => {
    setFiltroMapa('');
    setSomenteLivres(false);
    setPrecoMax('');
    setTipoVeiculoFiltro('');
    setOrdenacao('');
    setSomenteFavoritos(false);
  };

  const abrirReserva = async (est) => {
    try {
      const { data } = await api.get(`/vagas/por-estacionamento/${est.id}`);
      setVagasEstac(data);
    } catch { setVagasEstac([]); }
    setModalReserva(est);
  };

  // Veio do mapa público (Home) já com um estacionamento pré-selecionado
  useEffect(() => {
    if (location.state?.reservar) abrirReserva(location.state.reservar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmarReserva = async (est, vagaId, veiculoId, previsaoChegada) => {
    setEnviandoReserva(true);
    try {
      const vaga = vagasEstac.find(v => String(v.id) === String(vagaId));
      const params = { vagaId, veiculoId };
      if (previsaoChegada) params.previsaoChegada = new Date(previsaoChegada).toISOString();
      const { data } = await api.post('/estadias/reservar', null, { params });
      setModalReserva(null);
      setModalCodigo({
        codigo: data.codigo,
        estacionamentoNome: est.nome,
        vagaCodigo: vaga?.codigo || data.vaga?.codigo || vagaId,
      });
      toast.success('Reserva confirmada!', `Código gerado para ${est.nome}`);
      buscarEstadia();
    } catch (err) {
      toast.error('Erro na reserva', getErroMsg(err, 'Não foi possível concluir a reserva. Tente novamente.'));
    } finally {
      setEnviandoReserva(false);
    }
  };

  const irParaVeiculos = () => {
    setModalReserva(null);
    setAba('veiculos');
    setMostrarForm(true);
  };

  const handleAddVeiculo = async (e) => {
    e.preventDefault();
    setSalvandoVeiculo(true);
    try {
      await api.post('/veiculos', { ...formV, placa: formV.placa.toUpperCase(), ativo: true });
      toast.success('Veículo cadastrado!', formV.placa.toUpperCase());
      setFormV({ placa: '', modelo: '', cor: '', tipo: 'CARRO' });
      setMostrarForm(false);
      buscarDados();
    } catch (err) {
      toast.error('Erro', getErroMsg(err, 'Placa pode já estar cadastrada.'));
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  const handleRemoverVeiculo = async (id, placa) => {
    setRemovendoVeiculoId(id);
    try {
      await api.delete(`/veiculos/${id}`);
      toast.success('Veículo removido', placa);
      buscarDados();
    } catch { toast.error('Erro', 'Não foi possível remover.'); } finally {
      setRemovendoVeiculoId(null);
    }
  };

  const confirmarRemoverVeiculo = (id, placa) => {
    setConfirmacao({
      titulo: 'Remover veículo',
      mensagem: `Remover o veículo ${placa} da sua frota?`,
      corConfirmar: 'danger',
      textoConfirmar: 'Remover',
      onConfirmar: () => { setConfirmacao(null); handleRemoverVeiculo(id, placa); },
    });
  };

  const valorAtual = () => {
    if (!estadiaAtiva?.entrada || !agora) return 0;
    const vh = estadiaAtiva.vaga?.estacionamento?.valorHora || 0;
    return Math.max((agora - new Date(estadiaAtiva.entrada).getTime()) / 3600000, 1) * vh;
  };

  // Segundos restantes até a virada da próxima hora cheia de cobrança —
  // ajuda o motorista a decidir "saio agora ou compensa ficar mais um pouco".
  const segundosProximaHora = () => {
    if (!estadiaAtiva?.entrada || !agora) return null;
    const ms = agora - new Date(estadiaAtiva.entrada).getTime();
    const restante = 3600000 - (ms % 3600000);
    return Math.ceil(restante / 1000);
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

  const vagasLivres = (est) => Math.max(0, (est.vagasTotais ?? 0) - (est.vagasOcupadas ?? 0));

  // Distância em km via fórmula de Haversine, só calculável com a localização do usuário
  const distanciaKm = (est) => {
    if (!userPos) return null;
    const [lat1, lon1] = userPos;
    const R = 6371;
    const dLat = (est.latitude - lat1) * Math.PI / 180;
    const dLon = (est.longitude - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(est.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const estacComCoord = estacionamentos.filter(e => e.latitude && e.longitude);
  const filtrosAtivos = !!filtroMapa || somenteLivres || precoMax !== '' || !!tipoVeiculoFiltro || somenteFavoritos;

  const filtrados = estacComCoord
    .filter(e =>
      e.nome?.toLowerCase().includes(filtroMapa.toLowerCase()) ||
      e.endereco?.toLowerCase().includes(filtroMapa.toLowerCase()))
    .filter(e => !somenteLivres || vagasLivres(e) > 0)
    .filter(e => precoMax === '' || (e.valorHora ?? 0) <= Number(precoMax))
    .filter(e => !tipoVeiculoFiltro || (e.tiposAceitos ?? []).includes(tipoVeiculoFiltro))
    .filter(e => !somenteFavoritos || favoritoIds.has(e.id))
    .sort((a, b) => {
      if (ordenacao === 'preco') return (a.valorHora ?? 0) - (b.valorHora ?? 0);
      if (ordenacao === 'vagas') return vagasLivres(b) - vagasLivres(a);
      if (ordenacao === 'distancia' && userPos) return distanciaKm(a) - distanciaKm(b);
      return 0;
    });

  return (
    <>
      <PainelLayout
        aba={aba} setAba={setAba} itens={NAV}
        topbarTitle={topbarTitles[aba]}
        semPadding={aba === 'mapa'}
      >

        {/* ══ MAPA — sempre montado, oculto nas outras abas ══ */}
        <div className="busca-layout" style={{ display: aba === 'mapa' ? 'flex' : 'none' }}>
          <div className="busca-map">
            <MapContainer
              center={mapCenter}
              zoom={userPos ? 14 : 5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              <MapResize ativo={aba === 'mapa'} />
              {userPos && <RecenterMap pos={userPos} zoom={14} />}
              {selecionado?.latitude && <RecenterMap pos={[selecionado.latitude, selecionado.longitude]} zoom={16} />}
              {filtrados.map(est => {
                const livres = vagasLivres(est);
                return (
                  <Marker key={est.id} position={[est.latitude, est.longitude]}
                    icon={livres > 0 ? mkVerde : mkVermelho}
                    eventHandlers={{ click: () => setSelecionado(est) }}>
                    <Popup>
                      <div className="map-popup">
                        <div className="map-popup-head">
                          <strong className="map-popup-nome">{est.nome}</strong>
                          <button
                            type="button"
                            className={`btn-favorito ${favoritoIds.has(est.id) ? 'ativo' : ''}`}
                            onClick={e => { e.stopPropagation(); toggleFavorito(est.id); }}
                            aria-pressed={favoritoIds.has(est.id)}
                            aria-label={favoritoIds.has(est.id) ? `Remover ${est.nome} dos favoritos` : `Favoritar ${est.nome}`}
                            title={favoritoIds.has(est.id) ? 'Remover dos favoritos' : 'Favoritar'}>
                            <Icon name="star" size={16} filled={favoritoIds.has(est.id)} />
                          </button>
                        </div>
                        <span className="map-popup-end"><Icon name="pin" size={13} /> {est.endereco}</span>
                        <div className="map-popup-row">
                          <span className={`map-popup-vagas ${livres > 0 ? 'livre' : 'lotado'}`}>
                            <span className="live-dot" /> {livres > 0 ? `${livres} livres` : 'Lotado'}
                          </span>
                          <span className="map-popup-preco">R$ {est.valorHora?.toFixed(2)}/h</span>
                        </div>
                        <button
                          onClick={() => abrirReserva(est)}
                          disabled={livres === 0}
                          className={`map-popup-btn ${livres > 0 ? 'disponivel' : 'indisponivel'}`}>
                          {livres > 0 ? 'Reservar vaga' : 'Sem vagas'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div className="busca-list">
            <div className="busca-search-wrap">
              <span className="busca-search-icon"><Icon name="search" size={16} /></span>
              <input
                className="form-control busca-search-input"
                placeholder="Buscar por nome ou endereço..."
                value={filtroMapa}
                onChange={e => setFiltroMapa(e.target.value)}
                aria-label="Buscar por nome ou endereço"
              />
            </div>

            <div className="busca-filtros">
              <div className="busca-filtros-row">
                <div className="form-group busca-filtro-preco">
                  <label className="form-label" htmlFor="filtro-preco-max">Preço máx. (R$/h)</label>
                  <input
                    id="filtro-preco-max"
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="Sem limite"
                    value={precoMax}
                    onChange={e => setPrecoMax(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="filtro-tipo-veiculo">Veículo</label>
                  <select id="filtro-tipo-veiculo" className="form-control" value={tipoVeiculoFiltro}
                    onChange={e => setTipoVeiculoFiltro(e.target.value)}>
                    <option value="">Qualquer tipo</option>
                    <option value="CARRO">Carro</option>
                    <option value="MOTO">Moto</option>
                    <option value="CAMINHONETE">Caminhonete</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="filtro-ordenacao">Ordenar por</label>
                  <select id="filtro-ordenacao" className="form-control" value={ordenacao}
                    onChange={e => setOrdenacao(e.target.value)}>
                    <option value="">Padrão</option>
                    <option value="preco">Menor preço</option>
                    <option value="vagas">Mais vagas livres</option>
                    {userPos && <option value="distancia">Mais próximos</option>}
                  </select>
                </div>
              </div>
              <div className="busca-filtros-row busca-filtros-toggles">
                <label className="busca-filtro-check">
                  <input type="checkbox" checked={somenteLivres} onChange={e => setSomenteLivres(e.target.checked)} />
                  Só com vagas livres
                </label>
                <label className="busca-filtro-check">
                  <input type="checkbox" checked={somenteFavoritos} onChange={e => setSomenteFavoritos(e.target.checked)} />
                  Só favoritos
                </label>
                {filtrosAtivos && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
                    <Icon name="close" size={13} /> Limpar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="busca-list-header">
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
                {filtrados.length} {filtrados.length === 1 ? 'estacionamento' : 'estacionamentos'}
              </span>
              {userPos && <span style={{ fontSize: '.75rem', color: 'var(--green)' }}>● Localização ativa</span>}
            </div>

            {filtrados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="search" size={32} /></div>
                <h3>Nenhum resultado</h3>
                <p>{filtrosAtivos ? 'Tente ajustar a busca ou os filtros aplicados' : 'Tente outro nome ou endereço'}</p>
                {filtrosAtivos && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={limparFiltros}>
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : filtrados.map(est => {
              const livres = vagasLivres(est);
              const sel = selecionado?.id === est.id;
              return (
                <div key={est.id} className={`busca-list-item ${sel ? 'selected' : ''}`}
                  onClick={() => setSelecionado(est)}>
                  <div className="busca-list-item-top">
                    <div className="busca-list-item-info">
                      <div className="busca-list-item-nome">{est.nome}</div>
                      <div className="busca-list-item-end"><Icon name="pin" size={12} /> {est.endereco}</div>
                    </div>
                    <div className="busca-list-item-actions">
                      <button
                        type="button"
                        className={`btn-favorito ${favoritoIds.has(est.id) ? 'ativo' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleFavorito(est.id); }}
                        aria-pressed={favoritoIds.has(est.id)}
                        aria-label={favoritoIds.has(est.id) ? `Remover ${est.nome} dos favoritos` : `Favoritar ${est.nome}`}
                        title={favoritoIds.has(est.id) ? 'Remover dos favoritos' : 'Favoritar'}>
                        <Icon name="star" size={16} filled={favoritoIds.has(est.id)} />
                      </button>
                      <span className={`badge ${livres > 0 ? 'badge-green' : 'badge-red'}`}>
                        {livres > 0 ? `${livres} livres` : 'Lotado'}
                      </span>
                    </div>
                  </div>
                  <div className="busca-list-item-mid">
                    <span style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{est.vagasTotais} vagas</span>
                    <span className="busca-list-item-price">
                      R$ {est.valorHora?.toFixed(2)}<span style={{ fontSize: '.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/h</span>
                    </span>
                  </div>
                  <button
                    className={`btn btn-sm btn-full ${livres > 0 ? 'btn-primary' : 'btn-ghost'}`}
                    disabled={livres === 0}
                    onClick={e => { e.stopPropagation(); abrirReserva(est); }}>
                    {livres === 0 ? 'Sem vagas' : 'Reservar vaga'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ DEMAIS ABAS — com padding normal ══ */}
        {aba !== 'mapa' && (
          <div className="painel-abas-wrap">

            {/* ESTADIA */}
            {aba === 'estadia' && (
              <div className="estadia-wrap">
                {estadiaAtiva?.pendente ? (
                  <div className="ticket">
                    <div className="ticket-head" style={{ background: 'var(--grad-dusk)' }}>
                      <div className="ticket-head-label">Reserva pendente em</div>
                      <div className="ticket-head-name">{estadiaAtiva.vaga?.estacionamento?.nome || 'SmartPark'}</div>
                      <div className="ticket-head-addr">{estadiaAtiva.vaga?.estacionamento?.endereco}</div>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.9rem' }}>
                        Apresente este código ao operador ao chegar:
                      </p>
                      <div className="codigo-display">{estadiaAtiva.codigo}</div>
                    </div>
                    <div className="ticket-info">
                      <div>
                        <div className="ticket-info-label">VEÍCULO</div>
                        <div className="placa-badge" style={{ fontSize: '1rem' }}>{estadiaAtiva.veiculo?.placa}</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{estadiaAtiva.veiculo?.modelo}</div>
                      </div>
                      <div className="ticket-info-right">
                        <div className="ticket-info-label">VAGA RESERVADA</div>
                        <span className="badge badge-blue" style={{ fontSize: '.88rem', padding: '5px 14px' }}>
                          {estadiaAtiva.vaga?.codigo ? `Vaga ${estadiaAtiva.vaga.codigo}` : `ID ${estadiaAtiva.vaga?.id}`}
                        </span>
                      </div>
                    </div>
                    <div className="ticket-foot" style={{ background: 'rgba(245,158,11,.08)', borderTopColor: 'rgba(245,158,11,.15)', color: 'var(--amber)' }}>
                      <Icon name="hourglass" size={15} /> Aguardando check-in no estacionamento
                    </div>
                  </div>
                ) : estadiaAtiva ? (
                  <>
                    <div className="ticket">
                      <div className="ticket-head">
                        <div className="ticket-head-label">Estacionando em</div>
                        <div className="ticket-head-name">{estadiaAtiva.vaga?.estacionamento?.nome || 'SmartPark'}</div>
                        <div className="ticket-head-addr">{estadiaAtiva.vaga?.estacionamento?.endereco}</div>
                      </div>
                      <div className="ticket-price">
                        <div className="ticket-price-label">Valor acumulado</div>
                        {(() => {
                          const restante = segundosProximaHora();
                          const proximaHora = restante !== null && restante <= 300; // últimos 5 min
                          return (
                            <>
                              <div className={`ticket-price-value ${proximaHora ? 'proxima-hora' : ''}`}>
                                R$ {valorAtual().toFixed(2)}
                              </div>
                              {proximaHora && (
                                <div className="ticket-price-countdown">
                                  <Icon name="hourglass" size={13} /> +R$ {estadiaAtiva.vaga?.estacionamento?.valorHora?.toFixed(2)} em {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
                                </div>
                              )}
                            </>
                          );
                        })()}
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
                        <span className="ticket-time-label"><Icon name="clock" size={15} /> Hora de entrada</span>
                        <strong className="ticket-time-value">
                          {estadiaAtiva.entrada
                            ? new Date(estadiaAtiva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </strong>
                      </div>
                      <div className="ticket-foot"><Icon name="shield" size={15} /> Estadia ativa e monitorada pelo SmartPark</div>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 12, fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span className="live-dot" /> Valor ao vivo
                    </p>
                  </>
                ) : (
                  <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--grad-night)', color: '#fff',
                    }}>
                      <Icon name="parking" size={32} />
                    </div>
                    <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Nenhuma estadia ativa</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                      Você não está estacionado agora.<br />
                      Reserve uma vaga ou aguarde o operador registrar sua entrada.
                    </p>
                    <button className="btn btn-primary" onClick={() => setAba('mapa')}>
                      <Icon name="pin" size={15} /> Buscar vagas
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
                      {mostrarForm ? <><Icon name="close" size={14} /> Cancelar</> : <><Icon name="plus" size={14} /> Adicionar veículo</>}
                    </button>
                  </div>

                  {mostrarForm && (
                    <form onSubmit={handleAddVeiculo}
                      style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 18, marginBottom: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="veiculo-form-grid">
                        <div className="form-group">
                          <label className="form-label">Placa</label>
                          <input className="form-control placa" placeholder="ABC1234" maxLength={8}
                            value={formV.placa} onChange={e => setFormV(f => ({ ...f, placa: e.target.value.toUpperCase() }))} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tipo</label>
                          <select className="form-control" value={formV.tipo} onChange={e => setFormV(f => ({ ...f, tipo: e.target.value }))}>
                            <option value="CARRO">Carro</option>
                            <option value="MOTO">Moto</option>
                            <option value="CAMINHONETE">Caminhonete</option>
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
                      <button className="btn btn-success btn-full" type="submit" disabled={salvandoVeiculo}>
                        {salvandoVeiculo
                          ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
                          : 'Salvar veículo'}
                      </button>
                    </form>
                  )}

                  {veiculos.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon"><Icon name="car" size={32} /></div>
                      <h3>Nenhum veículo cadastrado</h3>
                      <p>Adicione um veículo para fazer reservas</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {veiculos.map(v => (
                        <div key={v.id} className="veiculo-item">
                          <div className="veiculo-item-left">
                            <span className="veiculo-tipo-icon"><Icon name={tiposIcon[v.tipo] || 'car'} size={22} /></span>
                            <div style={{ minWidth: 0 }}>
                              <div className="placa-badge" style={{ marginBottom: 4 }}>{v.placa}</div>
                              <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{v.modelo} · {v.cor}</div>
                              <span className="badge badge-gray" style={{ marginTop: 4, fontSize: '.7rem' }}>{v.tipo}</span>
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => confirmarRemoverVeiculo(v.id, v.placa)}
                            disabled={removendoVeiculoId === v.id}
                            style={{ color: 'var(--red)', borderColor: 'var(--red)', flexShrink: 0 }}>
                            {removendoVeiculoId === v.id
                              ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Removendo...</>
                              : 'Remover'}
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
                    <div className="empty-state-icon"><Icon name="list" size={32} /></div>
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
          est={modalReserva} vagas={vagasEstac} veiculos={veiculos}
          onConfirm={confirmarReserva} onClose={() => setModalReserva(null)}
          onIrParaVeiculos={irParaVeiculos}
          enviando={enviandoReserva}
        />
      )}
      {modalCodigo && (
        <ModalCodigo reserva={modalCodigo} onClose={() => setModalCodigo(null)} />
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

      {/* Atalho rápido: do mapa de busca direto pra "Minha estadia" — útil
          quando o motorista já reservou e quer ver o código/ticket de novo. */}
      {aba === 'mapa' && estadiaAtiva && (
        <button className="fab" title="Minha estadia" onClick={() => setAba('estadia')}>
          <Icon name="ticket" size={22} />
        </button>
      )}
      {/* Atalho rápido: de qualquer aba sem estadia ativa, ir buscar vaga */}
      {aba !== 'mapa' && !estadiaAtiva && (
        <button className="fab" title="Buscar vagas" onClick={() => setAba('mapa')}>
          <Icon name="pin" size={22} />
        </button>
      )}

      <style>{`
        .painel-abas-wrap { padding: 24px 28px; }
        .estadia-wrap { max-width: 520px; margin: 0 auto; }
        @media (max-width: 768px) {
          .painel-abas-wrap { padding: 16px; }
          .estadia-wrap { max-width: 100%; }
        }

        /* ── Buscar vagas: mapa + lista ── */
        .busca-layout { flex: 1; min-height: 0; display: flex; flex-direction: row; }
        .busca-map { flex: 1; min-height: 0; }
        .busca-list { width: 360px; flex-shrink: 0; background: var(--bg-surface); border-left: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; }

        .busca-search-wrap { position: relative; padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .busca-search-icon { position: absolute; left: 28px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; display: flex; }
        .busca-search-input { padding-left: 36px !important; background: var(--bg-card); }

        .busca-filtros { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
        .busca-filtros-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .busca-filtros-row .form-group { flex: 1 1 110px; gap: 4px; }
        .busca-filtros-row .form-control { background: var(--bg-card); }
        .busca-filtros-toggles { align-items: center; gap: 16px; row-gap: 8px; }
        .busca-filtro-check { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--text-secondary); cursor: pointer; user-select: none; }
        .busca-filtro-check input { accent-color: var(--violet); width: 15px; height: 15px; cursor: pointer; }

        .busca-list-header { padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; }
        .busca-list-item { padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; border-left: 3px solid transparent; transition: background .12s, border-color .12s; }
        .busca-list-item:hover { background: var(--bg-card); }
        .busca-list-item.selected { background: var(--violet-glow); border-left-color: var(--violet); }
        .busca-list-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .busca-list-item-info { min-width: 0; }
        .busca-list-item-nome { font-weight: 600; font-size: .92rem; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .busca-list-item-end  { font-size: .78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
        .busca-list-item-mid  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .busca-list-item-price { font-weight: 700; color: var(--green); font-size: .97rem; }
        .busca-list-item-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .btn-favorito { background: transparent; border: none; padding: 4px; margin: -4px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 6px; transition: color .15s; }
        .btn-favorito:hover { color: var(--amber); }
        .btn-favorito.ativo { color: var(--amber); }

        @media (max-width: 768px) {
          .busca-layout { flex-direction: column; }
          .busca-map { flex: none; height: 42vh; min-height: 240px; }
          .busca-list { width: 100%; flex: 1; border-left: none; border-top: 1px solid var(--border); }
        }
      `}</style>
    </>
  );
}