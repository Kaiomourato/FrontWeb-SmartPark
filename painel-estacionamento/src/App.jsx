import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import PainelOperador from './pages/PainelOperador';
import PainelMotorista from './pages/PainelMotorista'; // 1. Nova Importação

// Função auxiliar para proteger rotas privadas
function RotaPrivada({ children }) {
  const usuarioLogado = localStorage.getItem('usuario');
  return usuarioLogado ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rotas Privadas (Protegidas) */}
        <Route path="/painel-operador" element={<RotaPrivada><PainelOperador /></RotaPrivada>} />
        
        {/* 2. Rota do Motorista ativada */}
        <Route path="/painel-motorista" element={<RotaPrivada><PainelMotorista /></RotaPrivada>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;