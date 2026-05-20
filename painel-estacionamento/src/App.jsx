import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';

// Função auxiliar para proteger a rota do Dashboard
// Só deixa acessar se tiver um usuário salvo no localStorage
function RotaPrivada({ children }) {
  const usuarioLogado = localStorage.getItem('usuario');
  return usuarioLogado ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rotas Privadas (Protegidas) */}
        <Route 
          path="/dashboard" 
          element={
            <RotaPrivada>
              <Dashboard />
            </RotaPrivada>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;