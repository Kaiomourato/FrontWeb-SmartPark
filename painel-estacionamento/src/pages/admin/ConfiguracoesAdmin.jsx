import Icon from '../../components/Icon';

// Página intencionalmente enxuta: o projeto não tem um modelo de configurações
// persistidas no backend, então em vez de simular opções que não fazem nada,
// esta tela documenta o que já é configurável e onde.
export default function ConfiguracoesAdmin() {
  const itens = [
    { icon: 'wallet', titulo: 'Preços por tipo de veículo', local: 'Painel do Operador → Configurações', desc: 'Cada operador define o valor da hora do seu próprio estacionamento.' },
    { icon: 'parking', titulo: 'Vagas e tipos aceitos', local: 'Painel do Operador → Gerenciar vagas', desc: 'Criação, edição e desativação de vagas é feita pelo operador do estacionamento.' },
    { icon: 'layers', titulo: 'Dados do estacionamento', local: 'Painel do Operador → Configurações', desc: 'Nome, endereço e localização no mapa.' },
    { icon: 'shield', titulo: 'Papéis de acesso', local: 'Cadastro (Registro)', desc: 'ADMIN, OPERADOR (vinculado a um estacionamento) e USER (motorista) são atribuídos no cadastro.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 18, borderLeft: '3px solid var(--violet)' }}>
        <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--violet-light)' }}>Sobre esta página:</strong> o SmartPark ainda não tem
          configurações globais persistidas (ex.: tema, moeda, política de senha). O que existe hoje é configurado
          por quem opera cada estacionamento. Esta página serve de referência rápida.
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1rem' }}>O que é configurável hoje</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {itens.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div className="stat-card-icon" style={{ width: 36, height: 36, flexShrink: 0 }}><Icon name={item.icon} size={16} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{item.titulo}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--violet-light)', margin: '2px 0' }}>{item.local}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
