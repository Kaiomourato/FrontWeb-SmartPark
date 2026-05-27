import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Ajuste o caminho se necessário
import './style/PainelMotorista.css'; 

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function PainelMotorista() {
  const [usuario, setUsuario] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('estadias');

  const [veiculos, setVeiculos] = useState([]);
  const [estadiaAtiva, setEstadiaAtiva] = useState(null);
  const [estacionamentos, setEstacionamentos] = useState([]);
  
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [loadingEstadia, setLoadingEstadia] = useState(true);

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [tipo, setTipo] = useState('CARRO');
  const [mostrarForm, setMostrarForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/login');
      return;
    }
    setUsuario(JSON.parse(userSalvo));

    async function buscarDadosIniciais() {
      try {
        const [veiculosResp, estacResp] = await Promise.all([
          api.get('/veiculos/meus'),
          api.get('/estacionamentos') 
        ]);
        setVeiculos(veiculosResp.data);
        setEstacionamentos(estacResp.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoadingVeiculos(false);
      }
    }

    async function buscarEstadiaAtiva() {
      try {
        const response = await api.get('/estadias/minha-ativa');
        setEstadiaAtiva(response.data); 
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || (error.message && error.message.includes('aborted'))) return;
        console.error("Erro ao buscar estadia ativa:", error);
      } finally {
        setLoadingEstadia(false);
      }
    }

    buscarDadosIniciais();
    buscarEstadiaAtiva();

    const interval = setInterval(() => {
      buscarEstadiaAtiva();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleAdicionarVeiculo = async (e) => {
    e.preventDefault();
    try {
      const novoVeiculo = {
        placa: placa.toUpperCase(),
        modelo,
        cor,
        tipo,
        ativo: true
      };

      await api.post('/veiculos', novoVeiculo);
      const response = await api.get('/veiculos/meus'); 
      setVeiculos(response.data);
      setPlaca(''); setModelo(''); setCor(''); setTipo('CARRO');
      setMostrarForm(false);
      alert('Veículo cadastrado com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      alert('Erro ao cadastrar veículo. Verifique os dados.');
    }
  };

  const handleRemoverVeiculo = async (id) => {
    if (!window.confirm("Deseja remover este veículo?")) return;
    try {
      await api.delete(`/veiculos/${id}`);
      setVeiculos(veiculos.filter(v => v.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleReservarVaga = (estacionamentoNome) => {
    alert(`A reserva no ${estacionamentoNome} estará disponível em breve!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!usuario) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando...</p>;

  const centerPosition = [-14.235, -51.925]; 

  return (
    <div className="painel-container">
      
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <span>SmartPark 🚘</span>
            <button className="btn-sair-mobile" onClick={handleLogout}>Sair</button>
          </div>
          
          <nav className="sidebar-nav">
            <button className={`menu-btn ${abaAtiva === 'estadias' ? 'active' : ''}`} onClick={() => setAbaAtiva('estadias')}>
              ⏱️ <span>Minhas Estadias</span>
            </button>
            <button className={`menu-btn ${abaAtiva === 'mapa' ? 'active' : ''}`} onClick={() => setAbaAtiva('mapa')}>
              📍 <span>Buscar Vagas</span>
            </button>
            <button className={`menu-btn ${abaAtiva === 'veiculos' ? 'active' : ''}`} onClick={() => setAbaAtiva('veiculos')}>
              🚗 <span>Meus Veículos</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Logado como: <br/><strong>{usuario.email}</strong></p>
          <button className="btn-sair" onClick={handleLogout}>Sair do App</button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        
        {/* ABA: ESTADIAS */}
        {abaAtiva === 'estadias' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="page-title">Status da Estadia</h1>
            
            {loadingEstadia ? (
              <p>Buscando informações do pátio...</p>
            ) : estadiaAtiva ? (
              <div className="card ticket-container">
                <div className="ticket-header">
                  <span className="ticket-header-label">Estacionamento Atual</span>
                  <h2 className="ticket-header-title">
                    {/* Alteração: Lendo o nome do estacionamento através da Vaga */}
                    {estadiaAtiva.vaga?.estacionamento?.nome || 'Pátio SmartPark'}
                  </h2>
                </div>

                <div className="ticket-body">
                  <div className="ticket-price-box">
                    <span className="ticket-price-label">Valor Acumulado</span>
                    <span className="ticket-price-value">
                      R$ {estadiaAtiva.valor ? estadiaAtiva.valor.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="ticket-grid">
                    <div className="ticket-info-group">
                      <span className="ticket-info-label">Veículo</span>
                      <strong className="ticket-info-value">{estadiaAtiva.veiculo?.placa}</strong>
                      <span className="ticket-info-sub">{estadiaAtiva.veiculo?.modelo}</span>
                    </div>
                    <div className="ticket-info-group ticket-info-right">
                      <span className="ticket-info-label">Localização</span>
                      <strong className="ticket-info-value">
                        {/* Alteração: Lendo 'codigo' ao invés de 'numero' */}
                        {estadiaAtiva.vaga?.codigo ? `Vaga ${estadiaAtiva.vaga.codigo}` : `Vaga ID: ${estadiaAtiva.vaga?.id}`}
                      </strong>
                    </div>
                  </div>

                  <div className="ticket-time-box">
                    <span className="ticket-time-label">🕒 Hora de Entrada:</span>
                    <strong className="ticket-time-value">
                      {estadiaAtiva.entrada ? new Date(estadiaAtiva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </strong>
                  </div>

                  <div className="ticket-security-badge">
                    <span>🛡️</span>
                    <span>Sua estadia está sendo monitorada e protegida pela administração.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card estadia-status">
                <h2 className="card-title">Estadia em Andamento</h2>
                <div className="estadia-vazia">
                  <p>Você não possui estadias ativas no momento.</p>
                  <p className="subtext">Assim que o operador registrar a entrada da sua placa no pátio, as informações de cobrança aparecerão aqui automaticamente.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: MAPA */}
        {abaAtiva === 'mapa' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">Encontrar Estacionamentos</h1>
            
            <div className="mapa-container">
              <MapContainer center={centerPosition} zoom={4} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {estacionamentos.map(est => (
                  est.latitude && est.longitude && (
                    <Marker key={est.id} position={[est.latitude, est.longitude]} icon={defaultIcon}>
                      <Popup>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>{est.nome}</strong>
                          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem' }}>{est.endereco}</p>
                          <button className="btn-reservar" onClick={() => handleReservarVaga(est.nome)}>
                            Reservar Vaga
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* ABA: VEÍCULOS */}
        {abaAtiva === 'veiculos' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="page-title">Meus Veículos</h1>
            
            <div className="card">
              <div className="veiculos-header">
                <h2 className="card-title" style={{ margin: 0 }}>Frota Cadastrada</h2>
                <button className={`btn-toggle ${mostrarForm ? 'fechar' : ''}`} onClick={() => setMostrarForm(!mostrarForm)}>
                  {mostrarForm ? 'Cancelar' : '+ Adicionar'}
                </button>
              </div>

              {mostrarForm && (
                <form className="veiculo-form" onSubmit={handleAdicionarVeiculo}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Placa</label>
                      <input className="form-control placa" placeholder="ABC1234" value={placa} onChange={e => setPlaca(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo</label>
                      <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)}>
                        <option value="CARRO">🚗 Carro</option>
                        <option value="MOTO">🏍️ Moto</option>
                        <option value="CAMINHONETE">🛻 Caminhonete</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group large">
                      <label className="form-label">Modelo</label>
                      <input className="form-control" placeholder="Ex: Honda Civic" value={modelo} onChange={e => setModelo(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cor</label>
                      <input className="form-control" placeholder="Ex: Prata" value={cor} onChange={e => setCor(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-salvar">Salvar Veículo</button>
                </form>
              )}

              {loadingVeiculos ? (
                <p>Carregando veículos...</p>
              ) : veiculos.length === 0 ? (
                <div className="veiculo-vazio">
                  <p>Nenhum veículo cadastrado ainda.</p>
                </div>
              ) : (
                <div className="veiculo-lista">
                  {veiculos.map(v => (
                    <div key={v.id} className="veiculo-item">
                      <div>
                        <span className="veiculo-tipo">{v.tipo}</span>
                        <strong className="veiculo-placa-texto">{v.placa}</strong>
                        <div className="veiculo-detalhe-texto">{v.modelo} • {v.cor}</div>
                      </div>
                      <button className="btn-remover" onClick={() => handleRemoverVeiculo(v.id)}>Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}