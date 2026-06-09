import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Corrige ícone padrão do Leaflet com Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const markerVerde = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const markerVermelho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, 14); }, [pos]);
  return null;
}

export default function Home() {
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/estacionamentos')
      .then(r => setEstacionamentos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const mapCenter = userPos || [-15.78, -47.93];
  const filtrados = estacionamentos.filter(e =>
    e.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    e.endereco?.toLowerCase().includes(filtro.toLowerCase())
  );

  const vagasLivres = (est) => {
    const livres = est.vagasTotais - (est.vagasOcupadas ?? 0);
    return Math.max(0, livres);
  };

  const handleReservar = (est) => {
    if (!user) {
      navigate('/login', { state: { destino: '/painel-motorista', msg: 'Faça login para reservar uma vaga' } });
    } else {
      navigate('/painel-motorista', { state: { aba: 'mapa', reservar: est } });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🅿</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>SmartPark</span>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="desktop-nav">
          {user ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</span>
              <button className="btn btn-primary btn-sm"
                onClick={() => navigate(user.role === 'USER' ? '/painel-motorista' : '/painel-operador')}>
                Meu painel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Entrar</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/registro')}>Criar conta</button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        padding: '56px 24px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(37,99,235,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-glow)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 99, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--blue-light)', fontWeight: 500 }}>
            {estacionamentos.length} estacionamentos ao vivo
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: 16 }}>
          Encontre uma vaga,<br />
          <span style={{ color: 'var(--blue-light)' }}>sem dar volta</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 28px', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Veja em tempo real quais estacionamentos têm vagas disponíveis perto de você.
        </p>

        {/* Busca */}
        <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            className="form-control"
            style={{ paddingLeft: 40, background: 'var(--bg-card)', borderColor: 'var(--border)', fontSize: '0.95rem', height: 48 }}
            placeholder="Buscar por nome ou endereço..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </section>

      {/* ── Mapa + Lista ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1, minHeight: 0 }} className="home-grid">

        {/* Mapa */}
        <div style={{ position: 'sticky', top: 60, height: 'calc(100vh - 60px)', zIndex: 1 }}>
          <MapContainer center={mapCenter} zoom={userPos ? 14 : 5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {userPos && <RecenterMap pos={userPos} />}
            {filtrados.map(est => (
              est.latitude && est.longitude ? (
                <Marker
                  key={est.id}
                  position={[est.latitude, est.longitude]}
                  icon={vagasLivres(est) > 0 ? markerVerde : markerVermelho}
                  eventHandlers={{ click: () => setSelecionado(est) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                      <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a', fontSize: '0.95rem' }}>{est.nome}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: 8 }}>{est.endereco}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                        <span style={{ fontSize: '0.8rem' }}>🟢 {vagasLivres(est)} vagas livres</span>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>R$ {est.valorHora?.toFixed(2)}/h</span>
                      </div>
                      <button
                        onClick={() => handleReservar(est)}
                        style={{ width: '100%', padding: '7px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        {user ? 'Reservar vaga' : 'Entrar para reservar'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>

        {/* Lista lateral */}
        <div style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', overflowY: 'auto', maxHeight: 'calc(100vh - 60px)', position: 'sticky', top: 60 }}>
          <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {filtrados.length} {filtrados.length === 1 ? 'estacionamento' : 'estacionamentos'}
            </span>
            {userPos && <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>● Localização ativa</span>}
          </div>

          {loading ? (
            <div className="empty-state"><div className="spinner" /><span>Carregando...</span></div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🅿</div>
              <h3>Nenhum resultado</h3>
              <p>Tente outro nome ou endereço</p>
            </div>
          ) : (
            filtrados.map(est => {
              const livres = vagasLivres(est);
              const isSel = selecionado?.id === est.id;
              return (
                <div
                  key={est.id}
                  onClick={() => setSelecionado(est)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSel ? 'var(--blue-glow)' : 'transparent',
                    borderLeft: isSel ? '3px solid var(--blue)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{est.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {est.endereco}</div>
                    </div>
                    <span className={`badge ${livres > 0 ? 'badge-green' : 'badge-red'}`}>
                      {livres > 0 ? `${livres} livres` : 'Lotado'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {est.vagasTotais} vagas totais
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>
                      R$ {est.valorHora?.toFixed(2)}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/h</span>
                    </span>
                  </div>

                  <button
                    className={`btn btn-sm btn-full ${livres > 0 ? 'btn-primary' : 'btn-ghost'}`}
                    disabled={livres === 0}
                    onClick={e => { e.stopPropagation(); handleReservar(est); }}
                  >
                    {livres === 0 ? 'Sem vagas disponíveis' : user ? 'Reservar vaga' : 'Entrar para reservar'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .home-grid { grid-template-columns: 1fr !important; }
          .home-grid > div:first-child { height: 45vh; position: relative !important; top: auto !important; }
          .home-grid > div:last-child { max-height: none !important; position: relative !important; top: auto !important; }
        }
      `}</style>
    </div>
  );
}
