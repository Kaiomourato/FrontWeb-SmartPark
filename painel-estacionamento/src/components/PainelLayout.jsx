import { useState } from 'react';
import Sidebar from './Sidebar';

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
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>🅿 SmartPark</div>
          <div style={{ width: 32 }} />
        </div>
        <div className="painel-topbar">
          <div>
            <div className="painel-topbar-title">{topbarTitle}</div>
            {topbarSub && <div className="painel-topbar-sub">{topbarSub}</div>}
          </div>
        </div>
        <div className={semPadding ? 'painel-body painel-body-map' : 'painel-body'}>
          {children}
        </div>
      </main>
    </div>
  );
}