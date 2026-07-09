import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../Icon';
import { formatarMoeda } from '../../utils/formatadores';

// Mesmo estilo de pin usado no mapa público (Home.jsx), mas com 3 faixas de cor
// por ocupação em vez de 2 (livre/lotado) — combina com os limiares de
// ProgressoOcupacao (verde < 60%, âmbar 60-85%, vermelho >= 85%).
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
const mkAmbar = criarPin('#f59e0b');
const mkVermelho = criarPin('#ef4444');

function pinPorOcupacao(pct) {
  if (pct >= 85) return mkVermelho;
  if (pct >= 60) return mkAmbar;
  return mkVerde;
}

// `ranking` é a lista de RankingEstacionamentoDTO vinda de /admin/dashboard
// (ocupação e faturamento); `estacionamentos` vem de /estacionamentos (lat/lng).
// Junta os dois por id para não precisar de um endpoint novo só para o mapa.
export default function MapaEstacionamentos({ estacionamentos, ranking, height = 420 }) {
  const rankingPorId = new Map((ranking || []).map(r => [r.estacionamentoId, r]));
  const comCoordenadas = (estacionamentos || []).filter(e => e.latitude && e.longitude);
  const centro = comCoordenadas.length > 0
    ? [comCoordenadas[0].latitude, comCoordenadas[0].longitude]
    : [-15.78, -47.93];

  if (comCoordenadas.length === 0) {
    return (
      <div className="empty-state" style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state-icon"><Icon name="pin" size={32} /></div>
        <h3>Nenhum estacionamento com localização</h3>
        <p>Cadastre latitude/longitude para vê-los no mapa.</p>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <MapContainer center={centro} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {comCoordenadas.map(est => {
          const r = rankingPorId.get(est.id);
          const ocupacao = r?.ocupacaoPercentual ?? 0;
          const livres = Math.max(0, (est.vagasTotais ?? 0) - (est.vagasOcupadas ?? 0));
          return (
            <Marker key={est.id} position={[est.latitude, est.longitude]} icon={pinPorOcupacao(ocupacao)}>
              <Popup>
                <div className="map-popup">
                  <strong className="map-popup-nome">{est.nome}</strong>
                  <span className="map-popup-end"><Icon name="pin" size={13} /> {est.endereco}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.8rem', margin: '8px 0' }}>
                    <span>Vagas livres: <strong style={{ color: '#059669' }}>{livres}</strong></span>
                    <span>Vagas ocupadas: <strong style={{ color: '#dc2626' }}>{est.vagasOcupadas ?? 0}</strong></span>
                    <span>Ocupação: <strong>{ocupacao.toFixed(0)}%</strong></span>
                    <span>Faturamento total: <strong style={{ color: '#059669' }}>{formatarMoeda(r?.faturamentoTotal)}</strong></span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
