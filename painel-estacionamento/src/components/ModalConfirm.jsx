// Modal de confirmação temático, substituindo window.confirm().
// window.confirm() é renderizado de forma minúscula e inconsistente em
// navegadores mobile — ruim para um operador decidindo rápido na cancela.
export default function ModalConfirm({ aberto, titulo, mensagem, corConfirmar = 'danger', textoConfirmar = 'Confirmar', onConfirmar, onCancelar }) {
  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titulo}</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>{mensagem}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className={`btn btn-${corConfirmar}`} onClick={onConfirmar}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}
