import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PainelLayout from '../components/PainelLayout';
import Icon from '../components/Icon';
import DashboardAdmin from './admin/DashboardAdmin';
import UsuariosAdmin from './admin/UsuariosAdmin';
import EstacionamentosAdmin from './admin/EstacionamentosAdmin';
import VagasAdmin from './admin/VagasAdmin';
import PagamentosAdmin from './admin/PagamentosAdmin';
import RelatoriosAdmin from './admin/RelatoriosAdmin';
import AuditoriaAdmin from './admin/AuditoriaAdmin';
import ConfiguracoesAdmin from './admin/ConfiguracoesAdmin';
import PerfilAdmin from './admin/PerfilAdmin';

const NAV = [
  {
    label: 'Visão geral',
    items: [
      { id: 'dashboard', icon: <Icon name="gauge" size={18} />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'usuarios',        icon: <Icon name="users" size={18} />,   label: 'Usuários' },
      { id: 'operadores',      icon: <Icon name="shield" size={18} />,  label: 'Operadores' },
      { id: 'estacionamentos', icon: <Icon name="layers" size={18} />,  label: 'Estacionamentos' },
      { id: 'vagas',           icon: <Icon name="parking" size={18} />, label: 'Vagas' },
      { id: 'pagamentos',      icon: <Icon name="wallet" size={18} />,  label: 'Pagamentos' },
    ],
  },
  {
    label: 'Análises',
    items: [
      { id: 'relatorios', icon: <Icon name="barChart" size={18} />, label: 'Relatórios' },
      { id: 'auditoria',  icon: <Icon name="list" size={18} />,     label: 'Auditoria' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { id: 'configuracoes', icon: <Icon name="gear" size={18} />, label: 'Configurações' },
      { id: 'perfil',        icon: <Icon name="user" size={18} />, label: 'Perfil' },
    ],
  },
];

const TITULOS = {
  dashboard: 'Dashboard', usuarios: 'Usuários', operadores: 'Operadores',
  estacionamentos: 'Estacionamentos', vagas: 'Vagas', pagamentos: 'Pagamentos',
  relatorios: 'Relatórios', auditoria: 'Auditoria', configuracoes: 'Configurações', perfil: 'Perfil',
};

export default function PainelAdmin() {
  const { user } = useAuth();
  const [aba, setAba] = useState('dashboard');

  return (
    <PainelLayout
      aba={aba} setAba={setAba} itens={NAV}
      subtitulo={user?.email || 'Admin'}
      topbarTitle={TITULOS[aba]}
    >
      {aba === 'dashboard' && <DashboardAdmin />}
      {aba === 'usuarios' && <UsuariosAdmin />}
      {aba === 'operadores' && <UsuariosAdmin tipoFixo="OPERADOR" />}
      {aba === 'estacionamentos' && <EstacionamentosAdmin />}
      {aba === 'vagas' && <VagasAdmin />}
      {aba === 'pagamentos' && <PagamentosAdmin />}
      {aba === 'relatorios' && <RelatoriosAdmin />}
      {aba === 'auditoria' && <AuditoriaAdmin />}
      {aba === 'configuracoes' && <ConfiguracoesAdmin />}
      {aba === 'perfil' && <PerfilAdmin />}
    </PainelLayout>
  );
}
