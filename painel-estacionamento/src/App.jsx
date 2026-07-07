import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ConexaoBanner from './components/ConexaoBanner';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import PainelOperador from './pages/PainelOperador';
import PainelMotorista from './pages/PainelMotorista';
import PainelAdmin from './pages/PainelAdmin';

function RotaPrivada({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'operador' && user.role === 'USER') return <Navigate to="/painel-motorista" replace />;
  if (role === 'motorista' && (user.role === 'ADMIN' || user.role === 'OPERADOR')) return <Navigate to="/painel-operador" replace />;
  if (role === 'admin' && user.role !== 'ADMIN') return <Navigate to="/painel-operador" replace />;
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
