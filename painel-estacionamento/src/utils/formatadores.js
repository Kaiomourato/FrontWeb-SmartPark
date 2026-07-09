// Formatação compartilhada entre as páginas do painel admin — antes cada
// página (Dashboard, Usuários, Pagamentos, Auditoria, Relatórios, Mapa) tinha
// sua própria cópia local de formatarMoeda/formatarDataHora.
export function formatarMoeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2)}`;
}

export function formatarDataHora(data, { comAno = false, comSegundos = false } = {}) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    ...(comAno ? { year: 'numeric' } : {}),
    hour: '2-digit', minute: '2-digit',
    ...(comSegundos ? { second: '2-digit' } : {}),
  });
}
