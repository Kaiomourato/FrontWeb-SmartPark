import Icon from './Icon';

// Estado de erro distinto do empty-state "sem resultados" — antes uma falha de
// rede e uma lista genuinamente vazia mostravam exatamente a mesma mensagem.
export default function EstadoErro({ mensagem = 'Não foi possível carregar os dados agora.', onTentarNovamente }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon name="signalOff" size={32} /></div>
      <h3>Ops, algo deu errado</h3>
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
