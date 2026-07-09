// Fonte única de verdade para "qual painel pertence a esta role" — usada tanto
// no redirecionamento pós-login quanto nas rotas protegidas, para nunca divergir.
export function destinoPorRole(role) {
  if (role === 'ADMIN') return '/painel-admin';
  if (role === 'OPERADOR') return '/painel-operador';
  return '/painel-motorista';
}
