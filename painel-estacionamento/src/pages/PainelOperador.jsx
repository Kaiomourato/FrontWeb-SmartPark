import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PainelOperador() {
  const [usuario, setUsuario] = useState(null);
  const [placaEntrada, setPlacaEntrada] = useState('');
  const navigate = useNavigate();

  // Verifica se o operador está logado ao abrir a página
  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/login');
    } else {
      const userObj = JSON.parse(userSalvo);
      // Proteção extra: se for apenas USER, chuta de volta
      if (userObj.role === 'USER') {
        navigate('/painel-motorista');
      } else {
        setUsuario(userObj);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const handleRegistrarEntrada = (e) => {
    e.preventDefault();
    // No futuro, isso vai chamar o seu backend para iniciar a estadia
    alert(`Entrada registrada para a placa: ${placaEntrada.toUpperCase()}`);
    setPlacaEntrada('');
  };

  if (!usuario) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando painel...</p>;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8' }}>
      
      {/* Menu Lateral */}
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #1e293b' }}>
          SmartPark ⚙️
        </div>
        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ backgroundColor: '#334155', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              📊 Visão Geral
            </li>
            <li style={{ padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8' }}>
              🅿️ Gestão de Vagas
            </li>
            <li style={{ padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8' }}>
              ⏱️ Estadias Ativas
            </li>
            <li style={{ padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8' }}>
              💰 Financeiro
            </li>
          </ul>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Operador(a): <br/><strong style={{ color: 'white', fontSize: '1rem' }}>{usuario.email}</strong>
          </p>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sair do Sistema
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '2rem', fontSize: '1.75rem' }}>Dashboard do Estacionamento</h1>
        
        {/* Indicadores do Dia */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Vagas Ocupadas</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>12 / 50</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Entradas Hoje</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>34</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #22c55e', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Faturamento Parcial</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>R$ 185,00</p>
          </div>
        </div>

        {/* Ação Rápida: Entrada de Veículo */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Registrar Entrada Rápida</h2>
          
          <form onSubmit={handleRegistrarEntrada} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>Placa do Veículo</label>
              <input 
                type="text" 
                value={placaEntrada}
                onChange={(e) => setPlacaEntrada(e.target.value)}
                placeholder="ABC-1234"
                required
                maxLength={8}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '2px' }}
              />
            </div>
            <button 
              type="submit" 
              style={{ padding: '0.75rem 2rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', height: '47px' }}
            >
              Liberar Cancela ⬆️
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}