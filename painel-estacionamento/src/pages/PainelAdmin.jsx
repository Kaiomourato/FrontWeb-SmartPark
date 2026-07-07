import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PainelLayout from '../components/PainelLayout';
import Icon from '../components/Icon';

const NAV = [
  {
    label: 'Administração',
    items: [
      { id: 'dashboard', icon: <Icon name="gauge" size={18} />, label: 'Dashboard' },
    ],
  },
];

export default function PainelAdmin() {
  const { user, logout } = useAuth();
  const [aba, setAba] = useState('dashboard');

  return (
    <PainelLayout aba={aba} setAba={setAba} itens={NAV} subtitulo="Admin" topbarTitle="Painel Admin">
      <h1>Painel Admin</h1>
      <p>Bem-vindo, {user?.nome || user?.email}.</p>
      <button onClick={logout}>Sair</button>
    </PainelLayout>
  );
}
