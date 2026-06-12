// Padrões que indicam mensagens técnicas (stack trace, SQL, JDBC) que não devem ir para o usuário.
const PADROES_TECNICOS = [
  /jdbc/i,
  /\bsql\b/i,
  /exception/i,
  /org\.(springframework|hibernate)/i,
  /failed to convert/i,
  /required type/i,
];

// Extrai uma mensagem de erro segura (sempre string) de uma resposta da API,
// descartando objetos e mensagens técnicas cruas em favor do fallback.
// Também trata erros de rede/timeout (sem response) com mensagens específicas
// para o cenário de "cold start" do servidor e quedas de conexão no celular.
export function getErroMsg(err, fallback) {
  if (!err?.response) {
    if (!navigator.onLine) {
      return 'Sem conexão com a internet. Verifique seu Wi-Fi ou dados móveis.';
    }
    if (err?.code === 'ECONNABORTED') {
      return 'O servidor está demorando para responder (pode estar "esquentando" após período inativo). Tente novamente em alguns segundos.';
    }
    if (err?.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
    }
  }

  const data = err?.response?.data;
  const msg = typeof data === 'string' ? data : (data?.message || data?.error);

  if (typeof msg !== 'string' || !msg.trim()) return fallback;
  if (PADROES_TECNICOS.some(re => re.test(msg))) return fallback;
  return msg;
}
