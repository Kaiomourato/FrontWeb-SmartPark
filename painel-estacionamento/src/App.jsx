import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { destinoPorRole } from './utils/destino';
import { ToastProvider } from './context/ToastContext';
import ConexaoBanner from './components/ConexaoBanner';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import PainelOperador from './pages/PainelOperador';
import PainelMotorista from './pages/PainelMotorista';
import PainelAdmin from './pages/PainelAdmin';

const ROTA_POR_PAPEL = { admin: '/painel-admin', operador: '/painel-operador', motorista: '/painel-motorista' };

// Cada rota declara o papel que espera ("admin" | "operador" | "motorista"). Se a
// role do usuário logado não corresponder a essa rota, ele é mandado para o painel
// que de fato pertence à sua role — nunca para um fallback genérico "operador".
function RotaPrivada({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const rotaEsperada = ROTA_POR_PAPEL[role];
  if (rotaEsperada && destinoPorRole(user.role) !== rotaEsperada) {
    return <Navigate to={destinoPorRole(user.role)} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/painel-operador" element={<RotaPrivada role="operador"><PainelOperador /></RotaPrivada>} />
      <Route path="/painel-motorista" element={<RotaPrivada role="motorista"><PainelMotorista /></RotaPrivada>} />
      <Route path="/painel-admin" element={<RotaPrivada role="admin"><PainelAdmin /></RotaPrivada>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConexaoBanner />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
