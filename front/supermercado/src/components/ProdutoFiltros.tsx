import { CATEGORIAS } from '../domain/categorias';
import type { Filtros, Situacao } from '../domain/filtros';

const SITUACOES: { valor: Situacao; label: string }[] = [
  { valor: 'todas', label: 'Todas as situações' },
  { valor: 'vencimento', label: 'Perto do vencimento' },
  { valor: 'promocao', label: 'Em promoção' },
  { valor: 'reposicao', label: 'Reposição necessária' },
];

interface ProdutoFiltrosProps {
  filtros: Filtros;
  onChange: (filtros: Filtros) => void;
}

export default function ProdutoFiltros({ filtros, onChange }: ProdutoFiltrosProps) {
  return (
    <>
      <input
        type="search"
        placeholder="Buscar por nome"
        aria-label="Buscar por nome"
        value={filtros.busca}
        onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
      />
      <select
        aria-label="Filtrar por categoria"
        value={filtros.categoria}
        onChange={(e) => onChange({ ...filtros, categoria: e.target.value as Filtros['categoria'] })}
      >
        <option value="todas">Todas as categorias</option>
        {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select
        aria-label="Filtrar por situação"
        value={filtros.situacao}
        onChange={(e) => onChange({ ...filtros, situacao: e.target.value as Situacao })}
      >
        {SITUACOES.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
      </select>
    </>
  );
}