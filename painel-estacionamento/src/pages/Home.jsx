import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [estacionamentos, setEstacionamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarEstacionamentos() {
      try {
        // Busca os estacionamentos na rota pública do seu backend
        const response = await api.get('/estacionamentos');
        setEstacionamentos(response.data);
      } catch (error) {
        console.error("Erro ao buscar estacionamentos:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarEstacionamentos();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Cabeçalho Público */}
      <header style={{ backgroundColor: '#1e293b', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>SmartPark 🚗</h1>
        <div>
          <button onClick={() => navigate('/login')} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem' }}>
            Entrar
          </button>
          <button onClick={() => navigate('/registro')} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
            Cadastrar-se
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#334155', marginBottom: '2rem', textAlign: 'center' }}>Encontre vagas disponíveis perto de você</h2>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Buscando estacionamentos...</p>
        ) : estacionamentos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Nenhum estacionamento cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Lista os estacionamentos retornados do Java */}
            {estacionamentos.map((est) => (
              <div key={est.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{est.nome}</h3>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>📍 {est.endereco}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '4px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Vagas Totais</span>
                    <strong style={{ color: '#3b82f6' }}>{est.vagasTotais}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Valor / Hora</span>
                    <strong style={{ color: '#22c55e' }}>R$ {est.valorHora.toFixed(2)}</strong>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Para reservar uma vaga, por favor faça login ou cadastre-se!')}
                  style={{ width: '100%', backgroundColor: '#1e293b', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Reservar Vaga
                </button>
              </div>
            ))}

          </div>
        )}
      </main>
    </div>
  );
}