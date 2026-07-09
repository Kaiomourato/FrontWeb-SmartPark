// Placeholder de carregamento ("pulso") — usado nas páginas do painel admin no
// lugar do spinner de tela cheia, para dar sensação de estrutura já carregada.
export default function Skeleton({ width = '100%', height = 16, radius = 6, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <Skeleton width={34} height={34} radius={9} />
      <Skeleton width="70%" height={11} style={{ marginTop: 4 }} />
      <Skeleton width="50%" height={26} />
      <Skeleton width="60%" height={11} />
    </div>
  );
}

export function SkeletonCard({ height = 220 }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <Skeleton width="40%" height={16} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={height} radius={10} />
    </div>
  );
}

// Linhas de tabela "fantasma" — usado nas páginas de listagem (Usuários, Vagas,
// Pagamentos, Auditoria) enquanto a primeira página de resultados carrega.
export function SkeletonTable({ linhas = 6, colunas = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 16px', border: '1px solid var(--border)', borderRadius: 8 }}>
          {Array.from({ length: colunas }).map((_, j) => (
            <Skeleton key={j} width={j === 0 ? '20%' : `${Math.floor(100 / colunas)}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}
