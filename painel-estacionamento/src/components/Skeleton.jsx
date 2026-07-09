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
