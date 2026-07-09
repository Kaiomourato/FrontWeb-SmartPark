import Icon from './Icon';

// Paginação simples (anterior/próxima) reutilizada pelas páginas administrativas
// com listagens paginadas (Usuários, Vagas, Pagamentos, Auditoria).
export default function Paginacao({ pagina, totalPaginas, totalElementos, onMudarPagina }) {
  if (totalPaginas <= 1) return null;
  const paginaAtual = pagina + 1;

  return (
    <div className="paginacao">
      <span className="paginacao-info">
        Página {paginaAtual} de {totalPaginas}
        {totalElementos != null && ` · ${totalElementos} ${totalElementos === 1 ? 'registro' : 'registros'}`}
      </span>
      <div className="paginacao-botoes">
        <button className="btn btn-ghost btn-sm" disabled={pagina <= 0} onClick={() => onMudarPagina(pagina - 1)}>
          <Icon name="arrowUp" size={13} style={{ transform: 'rotate(-90deg)' }} /> Anterior
        </button>
        <button className="btn btn-ghost btn-sm" disabled={paginaAtual >= totalPaginas} onClick={() => onMudarPagina(pagina + 1)}>
          Próxima <Icon name="arrowUp" size={13} style={{ transform: 'rotate(90deg)' }} />
        </button>
      </div>
    </div>
  );
}
