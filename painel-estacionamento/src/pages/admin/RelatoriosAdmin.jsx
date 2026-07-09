import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Icon from '../../components/Icon';
import EstadoErro from '../../components/EstadoErro';
import { SkeletonCard } from '../../components/Skeleton';
import { formatarMoeda } from '../../utils/formatadores';

// Exportação client-side (sem endpoint novo): os relatórios aqui só reorganizam
// em tabela dados que o /admin/dashboard já retorna.
function exportarCsv(nomeArquivo, colunas, linhas) {
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const cabecalho = colunas.map(c => escapar(c.rotulo)).join(',');
  const corpo = linhas.map(linha => colunas.map(c => escapar(c.valor(linha))).join(',')).join('\n');
  const csv = '﻿' + cabecalho + '\n' + corpo;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

function TabelaRelatorio({ titulo, colunas, linhas, chaveArquivo }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>{titulo}</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => exportarCsv(`${chaveArquivo}.csv`, colunas, linhas)} disabled={linhas.length === 0}>
          <Icon name="download" size={14} /> Exportar CSV
        </button>
      </div>
      {linhas.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div className="empty-state-icon"><Icon name="barChart" size={28} /></div>
          <p>Sem dados ainda</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>{colunas.map(c => <th key={c.rotulo}>{c.rotulo}</th>)}</tr></thead>
            <tbody>
              {linhas.map((linha, i) => (
                <tr key={i}>{colunas.map(c => <td key={c.rotulo}>{c.render ? c.render(linha) : c.valor(linha)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RelatoriosAdmin() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data);
    } catch {
      setDashboard(null);
      setErro(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={160} />)}
    </div>
  );

  if (erro) return <EstadoErro mensagem="Não foi possível carregar os relatórios." onTentarNovamente={carregar} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <TabelaRelatorio
        titulo="Faturamento mensal (últimos 12 meses)"
        chaveArquivo="faturamento-mensal"
        colunas={[
          { rotulo: 'Mês', valor: l => l.data },
          { rotulo: 'Faturamento', valor: l => l.valor, render: l => formatarMoeda(l.valor) },
        ]}
        linhas={dashboard?.financeiro?.faturamentoMensal || []}
      />

      <TabelaRelatorio
        titulo="Check-ins por mês (últimos 12 meses)"
        chaveArquivo="checkins-mensal"
        colunas={[
          { rotulo: 'Mês', valor: l => l.rotulo },
          { rotulo: 'Check-ins', valor: l => l.quantidade },
        ]}
        linhas={dashboard?.checkinsPorMes || []}
      />

      <TabelaRelatorio
        titulo="Novos usuários por mês (últimos 12 meses)"
        chaveArquivo="novos-usuarios-mensal"
        colunas={[
          { rotulo: 'Mês', valor: l => l.rotulo },
          { rotulo: 'Novos usuários', valor: l => l.quantidade },
        ]}
        linhas={dashboard?.crescimentoUsuarios || []}
      />

      <TabelaRelatorio
        titulo="Ranking de estacionamentos"
        chaveArquivo="ranking-estacionamentos"
        colunas={[
          { rotulo: 'Estacionamento', valor: l => l.nome },
          { rotulo: 'Estadias', valor: l => l.totalEstadias },
          { rotulo: 'Ocupação (%)', valor: l => l.ocupacaoPercentual },
          { rotulo: 'Faturamento total', valor: l => l.faturamentoTotal, render: l => formatarMoeda(l.faturamentoTotal) },
        ]}
        linhas={dashboard?.topEstacionamentos || []}
      />
    </div>
  );
}
