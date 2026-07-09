import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { destinoPorRole } from '../utils/destino';
import { getErroMsg } from '../utils/erro';
import AppIcon from '../components/Icon';

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

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, 14); }, [pos]);
  return null;
}

// Distância aproximada em km entre duas coordenadas (fórmula de Haversine).
function distanciaKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const carregar = () => {
    setLoading(true);
    setErro(null);
    api.get('/estacionamentos')
      .then(r => setEstacionamentos(r.data))
      .catch(err => setErro(getErroMsg(err, 'Não foi possível carregar os estacionamentos.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserPos([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const mapCenter = userPos || [-15.78, -47.93];
  const vagasLivres = (e) => Math.max(0, (e.vagasTotais ?? 0) - (e.vagasOcupadas ?? 0));

  let filtrados = estacionamentos.filter(e =>
    e.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.endereco?.toLowerCase().includes(filtro.toLowerCase())
  );
  // Com a localização do motorista, ordena pelo mais próximo — decisão rápida no trânsito.
  if (userPos) {
    filtrados = [...filtrados].sort((a, b) => {
      if (!a.latitude || !a.longitude) return 1;
      if (!b.latitude || !b.longitude) return -1;
      return distanciaKm(userPos, [a.latitude, a.longitude]) - distanciaKm(userPos, [b.latitude, b.longitude]);
    });
  }

  const handleReservar = (est) => {
    if (!user) navigate('/login', { state: { destino: '/painel-motorista', msg: 'Faça login para reservar uma vaga.' } });
    else navigate('/painel-motorista', { state: { aba: 'mapa', reservar: est } });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="home-header">
        <Link to="/" className="home-logo" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo-icon"><AppIcon name="parking" size={16} /></div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>SmartPark</span>
        </Link>

        <nav className="home-nav">
          {user ? (
            <>
              <span className="home-nav-email">{user.email}</span>
              <button className="btn btn-primary btn-sm"
                onClick={() => navigate(destinoPorRole(user.role))}>
                Meu painel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Entrar</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/registro')}>Criar conta</button>
            </>
          )}
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero-pill">
          <span className="live-dot" />
          <span>{estacionamentos.length} estacionamentos ao vivo</span>
        </div>
        <h1 className="home-hero-title">
          Encontre uma vaga,<br />
          <span className="home-hero-highlight">sem dar volta</span>
        </h1>
        <p className="home-hero-sub">
          Veja em tempo real quais estacionamentos têm vagas disponíveis perto de você.
        </p>
        <div className="home-search-wrap">
          <span className="home-search-icon"><AppIcon name="search" size={18} /></span>
          <input
            className="form-control home-search-input"
            placeholder="Buscar por nome ou endereço..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </section>

      {/* ── Mapa + Lista ── */}
      <div className="home-body">
        {/* Mapa */}
        <div className="home-map-wrap">
          <MapContainer center={mapCenter} zoom={userPos ? 14 : 5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            {userPos && <RecenterMap pos={userPos} />}
            {filtrados.map(est => est.latitude && est.longitude ? (
              <Marker key={est.id} position={[est.latitude, est.longitude]}
                icon={vagasLivres(est) > 0 ? mkVerde : mkVermelho}
                eventHandlers={{ click: () => setSelecionado(est) }}>
                <Popup>
                  <div className="map-popup">
                    <strong className="map-popup-nome">{est.nome}</strong>
                    <span className="map-popup-end"><AppIcon name="pin" size={13} /> {est.endereco}</span>
                    <div className="map-popup-row">
                      <span className={`map-popup-vagas ${vagasLivres(est) > 0 ? 'livre' : 'lotado'}`}>
                        <span className="live-dot" /> {vagasLivres(est) > 0 ? `${vagasLivres(est)} livres` : 'Lotado'}
                      </span>
                      <span className="map-popup-preco">R$ {est.valorHora?.toFixed(2)}/h</span>
                    </div>
                    <button onClick={() => handleReservar(est)} disabled={vagasLivres(est) === 0}
                      className={`map-popup-btn ${vagasLivres(est) > 0 ? 'disponivel' : 'indisponivel'}`}>
                      {vagasLivres(est) > 0 ? (user ? 'Reservar vaga' : 'Entrar para reservar') : 'Sem vagas'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ) : null)}
          </MapContainer>
        </div>

        {/* Lista lateral */}
        <div className="home-list-wrap">
          <div className="home-list-header">
            <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
              {filtrados.length} {filtrados.length === 1 ? 'estacionamento' : 'estacionamentos'}
            </span>
            {userPos && <span style={{ fontSize: '.75rem', color: 'var(--green)' }}>● Localização ativa</span>}
          </div>

          {loading ? (
            <div className="empty-state"><div className="spinner" /><span>Buscando...</span></div>
          ) : erro ? (
            <div className="empty-state">
              <div className="empty-state-icon"><AppIcon name="signalOff" size={32} /></div>
              <h3>Não foi possível carregar</h3>
              <p>{erro}</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={carregar}>Tentar novamente</button>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><AppIcon name="search" size={32} /></div>
              <h3>Nenhum resultado</h3>
              <p>Tente outro nome ou endereço</p>
            </div>
          ) : filtrados.map(est => {
            const livres = vagasLivres(est);
            const sel = selecionado?.id === est.id;
            const dist = (userPos && est.latitude && est.longitude)
              ? distanciaKm(userPos, [est.latitude, est.longitude]) : null;
            return (
              <div key={est.id} className={`home-list-item ${sel ? 'selected' : ''}`}
                onClick={() => setSelecionado(est)}>
                <div className="home-list-item-top">
                  <div className="home-list-item-info">
                    <div className="home-list-item-nome">{est.nome}</div>
                    <div className="home-list-item-end"><AppIcon name="pin" size={12} /> {est.endereco}</div>
                  </div>
                  <span className={`badge ${livres > 0 ? 'badge-green' : 'badge-red'}`}>
                    {livres > 0 ? `${livres} livres` : 'Lotado'}
                  </span>
                </div>
                <div className="home-list-item-mid">
                  <span style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>
                    {est.vagasTotais} vagas{dist != null && ` · ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}`}
                  </span>
                  <span className="home-list-item-price">
                    R$ {est.valorHora?.toFixed(2)}<span style={{ fontSize: '.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/h</span>
                  </span>
                </div>
                <button
                  className={`btn btn-sm btn-full ${livres > 0 ? 'btn-primary' : 'btn-ghost'}`}
                  disabled={livres === 0}
                  onClick={e => { e.stopPropagation(); handleReservar(est); }}>
                  {livres === 0 ? 'Sem vagas' : user ? 'Reservar vaga' : 'Entrar para reservar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .home-header {
          background: var(--bg-surface); border-bottom: 1px solid var(--border);
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .home-logo { display: flex; align-items: center; gap: 10px; color: var(--text-primary); }
        .home-nav { display: flex; gap: 10px; align-items: center; }
        .home-nav-email { font-size: .85rem; color: var(--text-secondary); }

        .home-hero-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--violet-glow); border: 1px solid rgba(109,91,245,.3);
          border-radius: 99px; padding: 4px 14px; margin-bottom: 20px;
          font-size: .8rem; color: var(--violet-light); font-weight: 500;
        }
        .home-hero-title { font-size: clamp(1.7rem, 3.5vw, 2.6rem); font-weight: 700; letter-spacing: -1px; line-height: 1.2; margin-bottom: 16px; }
        .home-hero-highlight {
          background-image: var(--grad-sunrise); -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .home-hero-sub   { color: var(--text-secondary); max-width: 480px; margin: 0 auto 28px; font-size: 1rem; line-height: 1.6; }
        .home-search-wrap { max-width: 500px; margin: 0 auto; position: relative; }
        .home-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; display: flex; }
        .home-search-input { padding-left: 40px !important; background: var(--bg-card); height: 48px; }

        .home-list-header { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .home-list-item { padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; border-left: 3px solid transparent; transition: background .12s, border-color .12s; }
        .home-list-item:hover { background: var(--bg-card); }
        .home-list-item.selected { background: var(--violet-glow); border-left-color: var(--violet); }
        .home-list-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .home-list-item-info { min-width: 0; }
        .home-list-item-nome { font-weight: 600; font-size: .92rem; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .home-list-item-end  { font-size: .78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
        .home-list-item-mid  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .home-list-item-price { font-weight: 700; color: var(--green); font-size: .97rem; }

        @media (max-width: 768px) {
          .home-nav-email { display: none; }
          .home-hero { padding: 36px 16px 28px !important; }
          .home-hero-sub { font-size: .93rem; }
        }
        @media (max-width: 400px) {
          .home-nav .btn-ghost { display: none; }
        }
      `}</style>
    </div>
  );
}
