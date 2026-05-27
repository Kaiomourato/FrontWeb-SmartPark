import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Certifique-se de que o caminho aponta para o CSS que acabamos de criar
import './style/PainelOperador.css'; 

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
      if (error.code === 'ERR_CANCELED' || (error.message && error.message.includes('aborted'))) return;
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
      await api.post(`/estadias?placa=${placaEntrada.toUpperCase()}&vagaId=${vagaSelecionada}`);
      alert(`✅ Entrada registrada com sucesso para a placa ${placaEntrada.toUpperCase()}!`);
      setPlacaEntrada('');
      carregarDashboard(); 
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      const mensagemErro = error.response?.data?.message || error.response?.data || 'Erro ao liberar cancela.';
      alert(`Ops: ${mensagemErro}`);
    }
  };

  const handleFinalizarEstadia = async (idEstadia) => {
    if (!window.confirm("Deseja encerrar esta estadia e gerar a cobrança?")) return;

    try {
      const response = await api.put(`/estadias/${idEstadia}/finalizar`);
      const valorCobrado = response.data.valor ? response.data.valor.toFixed(2) : 'Calculado pelo sistema';
      
      alert(`💰 Estadia encerrada!\n\nCobre do cliente: R$ ${valorCobrado}`);
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
    <div className="operador-container">
      
      {/* Menu Lateral reaproveitado (Herdando o estilo base) */}
      <aside className="sidebar" style={{ backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: window.innerWidth > 768 ? '260px' : '100%' }}>
        <div>
          <div style={{ padding: '2rem 1.5rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SmartPark ⚙️</span>
            {window.innerWidth <= 768 && <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>}
          </div>
          <nav style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem' }}>
              📍 Controle de Pátio
            </button>
          </nav>
        </div>

        {window.innerWidth > 768 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>Operador: <br/><strong style={{ color: 'white', fontSize: '1rem', wordBreak: 'break-all' }}>{usuario?.email}</strong></p>
            <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sair do Sistema</button>
          </div>
        )}
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <h1 className="page-title">Controle de Pátio</h1>
        
        {/* Formulário de Nova Entrada */}
        <div className="card">
          <h2 className="card-title">Registrar Entrada</h2>
          
          <form className="entrada-form" onSubmit={handleRegistrarEntrada}>
            <div className="form-group">
              <label className="form-label">Placa do Veículo</label>
              <input 
                type="text" 
                className="form-control placa"
                value={placaEntrada}
                onChange={(e) => setPlacaEntrada(e.target.value)}
                placeholder="ABC1234"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alocar na Vaga:</label>
              <select 
                className="form-control"
                value={vagaSelecionada}
                onChange={(e) => setVagaSelecionada(e.target.value)}
                required
              >
                {vagas.length === 0 ? (
                  <option value="">Nenhuma vaga cadastrada</option>
                ) : (
                  vagas.map(v => (
                    // Lendo 'codigo' da sua entidade Vaga
                    <option key={v.id} value={v.id}>
                      {v.codigo ? `Vaga ${v.codigo}` : `Vaga ID: ${v.id}`} {v.ocupada ? '(Ocupada)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button type="submit" className="btn-liberar">
              Liberar Cancela ⬆️
            </button>
          </form>
        </div>

        {/* Lista de Estadias Ativas */}
        <div className="card">
          <h2 className="card-title">Veículos no Pátio ({estadiasAtivas.length})</h2>
          
          {estadiasAtivas.length === 0 ? (
            <p className="empty-state">O pátio está vazio no momento.</p>
          ) : (
            <div className="table-wrapper">
              <table className="estadias-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Vaga</th>
                    <th>Entrada</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {estadiasAtivas.map(estadia => (
                    <tr key={estadia.id}>
                      <td className="td-placa">
                        {estadia.veiculo?.placa || 'N/A'}
                      </td>
                      <td className="td-vaga">
                        {estadia.vaga?.codigo ? `Vaga ${estadia.vaga.codigo}` : `Vaga ${estadia.vaga?.id}`}
                      </td>
                      <td className="td-hora">
                        {estadia.entrada ? new Date(estadia.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-cobrar"
                          onClick={() => handleFinalizarEstadia(estadia.id)}
                        >
                          Encerrar & Cobrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}