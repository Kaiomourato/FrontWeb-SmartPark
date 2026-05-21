import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PainelOperador() {
  const [usuario, setUsuario] = useState(null);
  const [vagas, setVagas] = useState([]);
  const [estadiasAtivas, setEstadiasAtivas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Campos do formulário
  const [placaEntrada, setPlacaEntrada] = useState('');
  const [vagaSelecionada, setVagaSelecionada] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/login');
      return;
    }
    setUsuario(JSON.parse(userSalvo));
    carregarDashboard();
  }, [navigate]);

  const carregarDashboard = async () => {
    try {
      const [vagasResp, estadiasResp] = await Promise.all([
        api.get('/vagas'),
        api.get('/estadias/ativas')
      ]);
      
      setVagas(vagasResp.data);
      setEstadiasAtivas(estadiasResp.data);

      if (vagasResp.data.length > 0) {
        setVagaSelecionada(vagasResp.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarEntrada = async (e) => {
    e.preventDefault();
    if (!vagaSelecionada) {
      alert("Selecione uma vaga primeiro.");
      return;
    }

    try {
      // O FRONTEND AGORA É "BURRO" (E isso é ótimo!): 
      // Ele só manda a Placa digitada e o ID da vaga. O Java faz o resto.
      await api.post(`/estadias?placa=${placaEntrada.toUpperCase()}&vagaId=${vagaSelecionada}`);

      alert(`✅ Entrada registrada com sucesso para a placa ${placaEntrada.toUpperCase()}!`);
      setPlacaEntrada('');
      carregarDashboard(); 

    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      // Pega a mensagem de erro que o seu Java vai disparar (ex: "Placa não encontrada")
      const mensagemErro = error.response?.data?.message || error.response?.data || 'Erro ao liberar cancela.';
      alert(`Ops: ${mensagemErro}`);
    }
  };

  const handleFinalizarEstadia = async (idEstadia) => {
    if (!window.confirm("Deseja encerrar esta estadia e gerar a cobrança?")) return;

    try {
      const response = await api.put(`/estadias/${idEstadia}/finalizar`);
      const valorCobrado = response.data.valorTotal ? response.data.valorTotal.toFixed(2) : 'Calculado pelo sistema';
      
      alert(`💰 Estadia encerrada! \nCobre do cliente: R$ ${valorCobrado}`);
      carregarDashboard(); 
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      alert("Erro ao finalizar a estadia no servidor.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando sistema...</p>;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8' }}>
      
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #1e293b' }}>
          SmartPark ⚙️
        </div>
        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ backgroundColor: '#334155', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>📍 Controle de Pátio</li>
            <li style={{ padding: '0.75rem', color: '#94a3b8' }}>🅿️ Gestão de Vagas</li>
          </ul>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>Operador: <br/><strong style={{ color: 'white', fontSize: '1rem' }}>{usuario?.email}</strong></p>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sair do Sistema</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '2rem' }}>Controle de Pátio</h1>
        
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Registrar Entrada de Veículo</h2>
          
          <form onSubmit={handleRegistrarEntrada} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>Placa do Veículo</label>
              <input 
                type="text" 
                value={placaEntrada}
                onChange={(e) => setPlacaEntrada(e.target.value)}
                placeholder="ABC-1234"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '2px' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>Alocar na Vaga:</label>
              <select 
                value={vagaSelecionada}
                onChange={(e) => setVagaSelecionada(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              >
                {vagas.length === 0 ? (
                  <option value="">Nenhuma vaga cadastrada</option>
                ) : (
                  vagas.map(v => (
                    <option key={v.id} value={v.id}>Vaga {v.numero || v.id}</option>
                  ))
                )}
              </select>
            </div>
            <button type="submit" style={{ padding: '0.75rem 2rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', height: '47px' }}>
              Liberar Cancela ⬆️
            </button>
          </form>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Veículos no Pátio ({estadiasAtivas.length})</h2>
          
          {estadiasAtivas.length === 0 ? (
            <p style={{ color: '#64748b' }}>Não há veículos estacionados no momento.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Placa</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Vaga</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Entrada</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {estadiasAtivas.map(estadia => (
                  <tr key={estadia.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                      {estadia.veiculo?.placa || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      Vaga {estadia.vaga?.numero || estadia.vaga?.id || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#64748b' }}>
                      {new Date(estadia.dataHoraEntrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleFinalizarEstadia(estadia.id)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Finalizar / Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}