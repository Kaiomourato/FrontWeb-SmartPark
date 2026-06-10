export default function BarChart({ data, series, labelKey, height = 180, formatValue }) {
  const max = Math.max(1, ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0)));

  return (
    <div>
      {series.length > 1 && (
        <div className="bar-chart-legend">
          {series.map(s => (
            <span className="bar-chart-legend-item" key={s.key}>
              <span className="bar-chart-legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="bar-chart" style={{ height }}>
        {data.map((d, i) => (
          <div className="bar-chart-col" key={i}>
            <div className="bar-chart-bars">
              {series.map(s => {
                const valor = Number(d[s.key]) || 0;
                return (
                  <div key={s.key} className="bar-chart-bar"
                    style={{ height: `${Math.max((valor / max) * 100, 2)}%`, background: s.color }}
                    title={`${s.label}: ${formatValue ? formatValue(valor) : valor}`} />
                );
              })}
            </div>
            <div className="bar-chart-label">{d[labelKey]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
