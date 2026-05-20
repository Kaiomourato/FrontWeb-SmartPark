import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Importamos a nossa conexão com o Render

export default function PainelMotorista() {
  const [usuario, setUsuario] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  
  // Estados para o formulário de novo veículo
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const navigate = useNavigate();

  // 1. Carrega os dados do usuário e busca os veículos dele
  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/login');
      return;
    }
    
    const userObj = JSON.parse(userSalvo);
    setUsuario(userObj);

    // Função para buscar os veículos direto do banco de dados (via API)
    async function buscarVeiculos() {
      try {
        // Passamos o ID ou e-mail do usuário se o seu backend exigir, 
        // ou puxamos todos caso o backend ainda não filtre por usuário logado
        const response = await api.get('/veiculos'); 
        setVeiculos(response.data);
      } catch (error) {
        console.error("Erro ao buscar veículos do banco:", error);
      } finally {
        setLoadingVeiculos(false);
      }
    }

    buscarVeiculos();
  }, [navigate]);

  // 2. Função para salvar um novo veículo no banco de dados
  const handleAdicionarVeiculo = async (e) => {
    e.preventDefault();
    try {
      const novoVeiculo = {
        placa: placa.toUpperCase(),
        modelo: modelo,
        cor: cor,
        // Se a sua entidade Usuario no Java precisar ser vinculada:
        // usuario: { id: usuario.id } 
      };

      // Faz o POST real para a sua API no Render
      const response = await api.post('/veiculos', novoVeiculo);
      
      // Atualiza a lista na tela com o veículo que o banco acabou de criar
      setVeiculos([...veiculos, response.data]);
      
      // Limpa o formulário e esconde ele
      setPlaca('');
      setModelo('');
      setCor('');
      setMostrarForm(false);
      alert('Veículo cadastrado com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      alert('Erro ao cadastrar veículo. Verifique se o endpoint POST /veiculos está correto.');
    }
  };

  // 3. Função para deletar um veículo do banco de dados
  const handleRemoverVeiculo = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover este veículo?")) return;
    
    try {
      // Faz o DELETE real no banco de dados passando o ID do veículo
      await api.delete(`/veiculos/${id}`);
      
      // Remove da tela imediatamente
      setVeiculos(veiculos.filter(v => v.id !== id));
    } catch (error) {
      console.error("Erro ao deletar veículo:", error);
      alert('Erro ao remover o veículo do servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!usuario) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando...</p>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '2rem' }}>
      
      {/* Cabeçalho */}
      <header style={{ backgroundColor: '#2563eb', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Olá, Motorista! 🚘</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>{usuario.email}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sair
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Status da Estadia Atual (Simulado por enquanto) */}
        <section style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', border: '2px solid #3b82f6', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Estadia Atual</h2>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b' }}>Seu carro está estacionado no momento?</p>
          <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '8px', minWidth: '250px' }}>
            <p style={{ margin: 0, color: '#64748b' }}>Nenhuma estadia ativa no momento.</p>
          </div>
        </section>

        {/* Gerenciamento de Veículos REAL */}
        <section style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Meus Veículos</h2>
            <button 
              onClick={() => setMostrarForm(!mostrarForm)} 
              style={{ padding: '0.5rem 1rem', backgroundColor: mostrarForm ? '#64748b' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mostrarForm ? 'Cancelar' : '+ Adicionar Veículo'}
            </button>
          </div>

          {/* Formuário que aparece ao clicar em Adicionar */}
          {mostrarForm && (
            <form onSubmit={handleAdicionarVeiculo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Placa:</label>
                  <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" required maxLength={7} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Modelo / Marca:</label>
                  <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Hyundai HB20" required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>Cor:</label>
                  <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Ex: Prata" required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <button type="submit" style={{ padding: '0.6rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar no Banco</button>
            </form>
          )}
          
          {/* Listagem vinda do Banco Supabase */}
          {loadingVeiculos ? (
            <p style={{ color: '#64748b' }}>Consultando seus veículos...</p>
          ) : veiculos.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>Você não tem nenhum veículo cadastrado.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {veiculos.map((v) => (
                <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.1rem', letterSpacing: '1px' }}>{v.placa}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{v.modelo} - {v.cor}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoverVeiculo(v.id)}
                    style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </main>
    </div>
  );
}