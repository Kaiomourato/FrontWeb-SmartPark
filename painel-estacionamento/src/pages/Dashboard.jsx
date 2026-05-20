import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  // Esse hook verifica se o usuário está logado assim que a página abre
  useEffect(() => {
    const userSalvo = localStorage.getItem('usuario');
    if (!userSalvo) {
      navigate('/'); // Se não tiver usuário salvo, expulsa de volta pro Login
    } else {
      setUsuario(JSON.parse(userSalvo));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  if (!usuario) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Carregando...</p>;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8' }}>
      
      {/* Menu Lateral (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #334155' }}>
          SmartPark 🚗
        </div>
        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ cursor: 'pointer', backgroundColor: '#334155', padding: '0.75rem', borderRadius: '4px' }}>🏠 Início</li>
            <li style={{ cursor: 'pointer', padding: '0.75rem' }}>🅿️ Controle de Vagas</li>
            <li style={{ cursor: 'pointer', padding: '0.75rem' }}>⏱️ Estadias Ativas</li>
          </ul>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #334155' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Logado como: <br/><strong>{usuario.nome}</strong></p>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ color: '#334155', marginBottom: '2rem' }}>Visão Geral</h1>
        
        {/* Cards de Indicadores */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Vagas Ocupadas</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>0 / 50</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Entradas Hoje</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>0</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Faturamento (Dia)</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>R$ 0,00</p>
          </div>
        </div>

        {/* Área para futuras tabelas ou ações */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Ações Rápidas</h2>
          <p style={{ color: '#64748b' }}>Aqui nós vamos colocar o botão de Iniciar Estadia ou Validar o QR Code do cliente.</p>
        </div>
      </div>
      
    </div>
  );
}