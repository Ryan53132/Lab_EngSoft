import type { Categoria } from './categorias';

export type Situacao = 'todas' | 'vencimento' | 'promocao' | 'reposicao';

export interface Filtros {
  busca: string;
  categoria: Categoria | 'todas';
  situacao: Situacao;
}

export const FILTROS_INICIAIS: Filtros = { busca: '', categoria: 'todas', situacao: 'todas' };