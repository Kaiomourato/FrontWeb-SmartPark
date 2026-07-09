// Medidor de ocupação (0-100%) — usado no ranking de estacionamentos e na
// distribuição geral de vagas livres x ocupadas. Cor por faixa (verde/âmbar/
// vermelho) segue a mesma linguagem de alerta já usada nos tiles do pátio.
function corPorPercentual(pct) {
  if (pct >= 85) return 'var(--red)';
  if (pct >= 60) return 'var(--amber)';
  return 'var(--green)';
}

export default function ProgressoOcupacao({ percentual, height = 8 }) {
  const pct = Math.max(0, Math.min(100, percentual || 0));
  return (
    <div className="ocupacao-meter">
      <div className="ocupacao-meter-track" style={{ height }}>
        <div className="ocupacao-meter-fill" style={{ width: `${pct}%`, background: corPorPercentual(pct) }} />
      </div>
      <span className="ocupacao-meter-label">{pct.toFixed(0)}%</span>
    </div>
  );
}
