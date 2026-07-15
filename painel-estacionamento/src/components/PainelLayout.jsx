import { useState } from 'react';
import Sidebar from './Sidebar';
import Icon from './Icon';
import NotificationBell from './NotificationBell';

export default function PainelLayout({ aba, setAba, itens, subtitulo, topbarTitle, topbarSub, children, semPadding }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="painel-layout">
      <Sidebar
        aba={aba} setAba={setAba} itens={itens} subtitulo={subtitulo}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />
      <main className="painel-main">
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={20} /></button>
          <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="parking" size={18} /> SmartPark
          </div>
          <NotificationBell />
        </div>
        <div className="painel-topbar">
          <div>
            <div className="painel-topbar-title">{topbarTitle}</div>
            {topbarSub && <div className="painel-topbar-sub">{topbarSub}</div>}
          </div>
          <NotificationBell />
        </div>
        <div className={semPadding ? 'painel-body painel-body-map' : 'painel-body'}>
          {children}
        </div>
      </main>
    </div>
  );
}