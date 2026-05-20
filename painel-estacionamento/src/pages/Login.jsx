import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Evita que a página recarregue ao dar submit
    setErro('');
    setLoading(true);

    try {
      // Fazendo a chamada POST para o seu backend Spring Boot
      const response = await api.post('/auth/login', {
        email: email,
        senha: senha
      });

      // Salvando os dados do usuário no armazenamento do navegador (Local Storage)
      localStorage.setItem('usuario', JSON.stringify(response.data));
      
      // Redireciona o dono do estacionamento para o Dashboard recém-criado
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      // Se a API retornar erro (ex: 401 ou 403), mostramos essa mensagem
      setErro('Credenciais inválidas ou erro no servidor. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1e293b' }}>
          SmartPark 🚗
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>
          Acesse o painel do seu estacionamento
        </p>
        
        {/* Exibição da mensagem de erro */}
        {erro && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '500' }}>E-mail:</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '500' }}>Senha:</label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '0.75rem', 
              backgroundColor: loading ? '#94a3b8' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '1rem', 
              fontWeight: 'bold',
              marginTop: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}