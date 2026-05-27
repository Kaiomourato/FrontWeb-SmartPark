import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import './style/PainelOperador.css'; 

export default function PainelOperador() {
  const [usuario, setUsuario] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('controle'); 
  const [loading, setLoading] = useState(true);
  
  const [vagas, setVagas] = useState([]);
  const [estadiasAtivas, setEstadiasAtivas] = useState([]);
  const [placaEntrada, setPlacaEntrada] = useState('');
  const [vagaSelecionada, setVagaSelecionada] = useState('');

  const [estacionamento, setEstacionamento] = useState(null);
  const [novoValorHora, setNovoValorHora] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [codigoNovaVaga, setCodigoNovaVaga] = useState('');

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
      // 1. Busca os dados do estacionamento primeiro
      const estacResp = await api.get('/estacionamentos');
      let estacId = null;

      if (estacResp.data.length > 0) {
        const estac = estacResp.data[0];
        setEstacionamento(estac);
        setNovoNome(estac.nome);
        setNovoValorHora(estac.valorHora);
        estacId = estac.id;
      }

      // 2. Busca as vagas (filtrando pelo estacionamento) e as estadias
      const [vagasResp, estadiasResp] = await Promise.all([
        api.get(estacId ? `/vagas?estacionamentoId=${estacId}` : '/vagas'),
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
      alert(`✅ Entrada registrada para a placa ${placaEntrada.toUpperCase()}!`);
      setPlacaEntrada('');
      carregarDashboard(); 
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      alert(`Ops: ${error.response?.data?.message || 'Erro ao liberar cancela.'}`);
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
      alert("Erro ao finalizar a estadia.");
    }
  };

  const handleAtualizarEstacionamento = async (e) => {
    e.preventDefault();
    if (!estacionamento) return;
    try {
      await api.put(`/estacionamentos/${estacionamento.id}`, {
        ...estacionamento,
        nome: novoNome,
        valorHora: parseFloat(novoValorHora)
      });
      alert('Informações do estacionamento atualizadas com sucesso!');
      carregarDashboard();
    } catch (error) {
      console.error("Erro ao atualizar estacionamento:", error);
      alert('Erro ao atualizar os dados. Verifique a API.');
    }
  };

  const handleAdicionarVaga = async (e) => {
    e.preventDefault();
    if (!estacionamento) {
      alert("Nenhum estacionamento configurado para receber vagas.");
      return;
    }
    try {
      await api.post('/vagas', {
        codigo: codigoNovaVaga,
        ocupada: false,
        estacionamento: { id: estacionamento.id }
      });
      alert(`Vaga ${codigoNovaVaga} criada com sucesso!`);
      setCodigoNovaVaga('');
      carregarDashboard();
    } catch (error) {
      console.error("Erro ao criar vaga:", error);
      alert('Erro ao criar a vaga. Verifique a API.');
    }
  };

  // NOVO: Função para excluir vaga conectada à API
  const handleExcluirVaga = async (idVaga, codigoVaga) => {
    if (!window.confirm(`Tem certeza que deseja excluir a vaga ${codigoVaga}?`)) return;
    try {
      await api.delete(`/vagas/${idVaga}`);
      alert(`Vaga ${codigoVaga} excluída com sucesso!`);
      carregarDashboard();
    } catch (error) {
      console.error("Erro ao excluir vaga:", error);
      alert(error.response?.data?.message || 'Erro ao excluir a vaga. Ela pode estar ocupada.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando sistema...</p>;

  return (
    <div className="operador-container">
      
      <aside className="sidebar" style={{ backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: window.innerWidth > 768 ? '260px' : '100%' }}>
        <div>
          <div style={{ padding: '2rem 1.5rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SmartPark ⚙️</span>
            {window.innerWidth <= 768 && <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>}
          </div>
          
          <nav style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setAbaAtiva('controle')}
              style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', backgroundColor: abaAtiva === 'controle' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              📍 Controle de Pátio
            </button>
            <button 
              onClick={() => setAbaAtiva('configuracoes')}
              style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', backgroundColor: abaAtiva === 'configuracoes' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              ⚙️ Configurações
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

      <main className="main-content">
        
        {abaAtiva === 'controle' && (
          <>
            <h1 className="page-title">Controle de Pátio</h1>
            
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
                      <option value="">Nenhuma vaga disponível</option>
                    ) : (
                      vagas.map(v => (
                        <option key={v.id} value={v.id} disabled={v.ocupada}>
                          {v.codigo ? `Vaga ${v.codigo}` : `Vaga ID: ${v.id}`} {v.ocupada ? '⛔ (Ocupada)' : '✅ (Livre)'}
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
                          <td className="td-placa">{estadia.veiculo?.placa || 'N/A'}</td>
                          <td className="td-vaga">{estadia.vaga?.codigo ? `Vaga ${estadia.vaga.codigo}` : `Vaga ${estadia.vaga?.id}`}</td>
                          <td className="td-hora">{estadia.entrada ? new Date(estadia.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' }) : '--:--'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-cobrar" onClick={() => handleFinalizarEstadia(estadia.id)}>
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
          </>
        )}

        {abaAtiva === 'configuracoes' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="page-title">Configurações do Pátio</h1>
            
            <div className="card">
              <h2 className="card-title">Dados Gerais e Precificação</h2>
              <form onSubmit={handleAtualizarEstacionamento} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ minWidth: '250px' }}>
                  <label className="form-label">Nome do Estacionamento</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ minWidth: '150px' }}>
                  <label className="form-label">Valor da Hora (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control"
                    value={novoValorHora}
                    onChange={(e) => setNovoValorHora(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-liberar" style={{ backgroundColor: '#10b981' }}>
                  💾 Salvar Dados
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Gerenciar Vagas 
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>
                  Total: {vagas.length}
                </span>
              </h2>
              
              <form onSubmit={handleAdicionarVaga} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Código da Nova Vaga (Ex: A-10)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={codigoNovaVaga}
                    onChange={(e) => setCodigoNovaVaga(e.target.value)}
                    placeholder="Digite o código..."
                    required
                  />
                </div>
                <button type="submit" className="btn-liberar" style={{ backgroundColor: '#3b82f6' }}>
                  + Criar Vaga
                </button>
              </form>

              <div className="table-wrapper">
                <table className="estadias-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Status Atual</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vagas.map(vaga => (
                      <tr key={vaga.id}>
                        <td className="td-placa" style={{ color: '#334155' }}>{vaga.codigo}</td>
                        <td>
                          {vaga.ocupada 
                            ? <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>Ocupada</span> 
                            : <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>Livre</span>
                          }
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-cobrar" 
                            style={{ backgroundColor: '#ef4444' }}
                            onClick={() => handleExcluirVaga(vaga.id, vaga.codigo)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}