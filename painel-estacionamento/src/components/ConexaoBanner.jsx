import { useOnlineStatus } from '../hooks/useOnlineStatus';
import Icon from './Icon';

// Banner fixo no topo avisando quando o app está sem internet.
// Em estacionamentos (subsolo, garagens cobertas) o sinal cai com frequência,
// e sem esse aviso o usuário não entende por que a tela "não atualiza".
export default function ConexaoBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="conexao-banner offline" role="status">
      <Icon name="signalOff" size={15} /> Sem conexão com a internet — algumas informações podem estar desatualizadas
    </div>
  );
}
