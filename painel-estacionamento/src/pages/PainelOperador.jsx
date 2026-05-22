import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PainelMotorista() {
  const [usuario, setUsuario] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [estadiaAtiva, setEstadiaAtiva] = useState(null);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [loadingEstadia, setLoadingEstadia] = useState(true);
  
  // Detecção de tela para responsividade
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Estados para o formulário
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [tipo, setTipo] = useState('CARRO');
  const [mostrarForm, setMostrarForm] = useState(false);

  const navigate = useNavigate();

  // Efeito para monitorar o tamanho da tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/login');
      return;
    }
    
    const userObj = JSON.parse(userSalvo);
    setUsuario(userObj);

    async function buscarVeiculos() {
      try {
        const response = await api.get('/veiculos/meus'); 
        setVeiculos(response.data);
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
      } finally {
        setLoadingVeiculos(false);
      }
    }

    async function buscarEstadiaAtiva() {
      try {
        const response = await api.get('/estadias/minha-ativa');
        setEstadiaAtiva(response.data); 
      } catch (error) {
        // Ignora aviso de cancelamento do React
        if (error.code === 'ERR_CANCELED' || (error.message && error.message.includes('aborted'))) return;
        console.error("Erro ao buscar estadia ativa:", error);
      } finally {
        setLoadingEstadia(false);
      }
    }

    buscarVeiculos();
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
        modelo: modelo,
        cor: cor,
        tipo: tipo,
        ativo: true
      };

      const response = await api.post('/veiculos', novoVeiculo);
      setVeiculos([...veiculos, response.data]);
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

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!usuario) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando...</p>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Cabeçalho */}
      <header style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: isMobile ? '1rem' : '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.2rem' }}>SmartPark 🚘</h1>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{usuario.email}</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid white', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>Sair</button>
      </header>

      <main style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Acompanhamento de Estadia Atual em Tempo Real */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: isMobile ? '1.25rem' : '1.5rem', 
          borderRadius: '12px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
          borderLeft: estadiaAtiva ? '6px solid #10b981' : '6px solid #64748b' 
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: isMobile ? '1.1rem' : '1.2rem', color: '#1e293b' }}>⏱️ Estadia em Andamento</h2>
          
          {loadingEstadia ? (
            <p style={{ fontSize: '0.9rem' }}>Verificando pátio...</p>
          ) : estadiaAtiva ? (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: isMobile ? '1.75rem' : '1.5rem', fontWeight: 'bold', color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>
                  R$ {estadiaAtiva.valor ? estadiaAtiva.valor.toFixed(2) : '0.00'}
                </span>
                <strong style={{ fontSize: '1.1rem' }}>{estadiaAtiva.veiculo?.placa}</strong>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>
                  📍 {estadiaAtiva.vaga?.numero ? `Vaga ${estadiaAtiva.vaga.numero}` : 'Vaga Alocada'} <br/>
                  🕒 Entrada: {estadiaAtiva.entrada ? new Date(estadiaAtiva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#e0f2fe', 
                color: '#0369a1', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.9rem', 
                fontWeight: '500',
                width: isMobile ? '100%' : 'auto',
                textAlign: isMobile ? 'center' : 'left',
                boxSizing: 'border-box'
              }}>
                🚗 Seu veículo está no pátio
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
              <p style={{ margin: 0 }}>Nenhum veículo seu está estacionado no momento.</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Quando você entrar em um pátio SmartPark, o cronômetro aparecerá aqui automaticamente.</p>
            </div>
          )}
        </div>

        {/* Seção de Veículos */}
        <div style={{ backgroundColor: 'white', padding: isMobile ? '1.25rem' : '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.2rem' }}>Meus Veículos</h2>
            <button 
              onClick={() => setMostrarForm(!mostrarForm)}
              style={{ backgroundColor: mostrarForm ? '#64748b' : '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {mostrarForm ? 'Fechar' : '+ Novo'}
            </button>
          </div>

          {mostrarForm && (
            <form onSubmit={handleAdicionarVeiculo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                <input placeholder="PLACA (Ex: ABC1234)" value={placa} onChange={e => setPlaca(e.target.value)} required style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '1rem' }} />
                <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                  <option value="CARRO">🚗 Carro</option>
                  <option value="MOTO">🏍️ Moto</option>
                  <option value="CAMINHONETE">🛻 Caminhonete</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                <input placeholder="Modelo (Ex: Civic)" value={modelo} onChange={e => setModelo(e.target.value)} required style={{ flex: 2, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                <input placeholder="Cor" value={cor} onChange={e => setCor(e.target.value)} required style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>Salvar Veículo</button>
            </form>
          )}

          {loadingVeiculos ? (
            <p style={{ fontSize: '0.9rem' }}>Carregando veículos...</p>
          ) : veiculos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>Nenhum veículo cadastrado.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {veiculos.map(v => (
                <div key={v.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row', 
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '1rem' : '0'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>{v.tipo}</span>
                    <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{v.placa}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{v.modelo} • {v.cor}</div>
                  </div>
                  <button onClick={() => handleRemoverVeiculo(v.id)} style={{ color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', width: isMobile ? '100%' : 'auto' }}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}