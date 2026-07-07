import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sp_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.removeItem('sp_user'); }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('sp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sp_user');
    setUser(null);
  };

  const isOperador = user?.role === 'ADMIN' || user?.role === 'OPERADOR';
  const isMotorista = user?.role === 'USER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, isOperador, isMotorista, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
