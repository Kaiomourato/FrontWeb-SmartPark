import { useState } from 'react';
import Sidebar from './Sidebar';

export default function PainelLayout({ aba, setAba, itens, titulo, subtitulo, topbarTitle, topbarSub, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="painel-layout">
      <Sidebar
        aba={aba}
        setAba={setAba}
        itens={itens}
        subtitulo={subtitulo}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="painel-main">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>🅿 SmartPark</div>
          <div style={{ width: 32 }} />
        </div>

        {/* Desktop topbar */}
        <div className="painel-topbar">
          <div>
            <div className="painel-topbar-title">{topbarTitle}</div>
            {topbarSub && <div className="painel-topbar-sub">{topbarSub}</div>}
          </div>
        </div>

        <div className="painel-body">
          {children}
        </div>
      </main>
    </div>
  );
}
