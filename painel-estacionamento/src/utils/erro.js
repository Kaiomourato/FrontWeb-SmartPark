// Padrões que indicam mensagens técnicas (stack trace, SQL, JDBC) que não devem ir para o usuário.
const PADROES_TECNICOS = [/jdbc/i, /\bsql\b/i, /exception/i, /org\.(springframework|hibernate)/i];

// Extrai uma mensagem de erro segura (sempre string) de uma resposta da API,
// descartando objetos e mensagens técnicas cruas em favor do fallback.
export function getErroMsg(err, fallback) {
  const data = err?.response?.data;
  const msg = typeof data === 'string' ? data : (data?.message || data?.error);

  if (typeof msg !== 'string' || !msg.trim()) return fallback;
  if (PADROES_TECNICOS.some(re => re.test(msg))) return fallback;
  return msg;
}
