export const CATEGORIAS = ['Hortifrúti', 'Industrializado', 'Limpeza'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface DadosProduto {
  id?: number;
  nome: string;
  preco: number;
  dataValidade: string;
  quantidade: number;
  estoqueMinimo?: number;
}

export type NovoProduto = DadosProduto & { categoria: Categoria };

export abstract class Produto {
  static NOME: Categoria;
  static ESTOQUE_MINIMO_PADRAO = 0;

  readonly id: number;
  readonly nome: string;
  readonly categoria: Categoria;
  readonly preco: number;
  readonly dataValidade: string;
  readonly quantidade: number;
  readonly estoqueMinimo: number;

  constructor(dados: DadosProduto) {
    const tipo = this.constructor as typeof Produto;
    this.id = dados.id ?? 0;
    this.nome = dados.nome;
    this.categoria = tipo.NOME;
    this.preco = dados.preco;
    this.dataValidade = dados.dataValidade;
    this.quantidade = dados.quantidade;
    this.estoqueMinimo = dados.estoqueMinimo ?? tipo.ESTOQUE_MINIMO_PADRAO;
  }

  // Cópia imutável, para o React detectar a mudança
  comQuantidade(quantidade: number): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { quantidade });
  }
}

export class Hortifruti extends Produto {
  static NOME: Categoria = 'Hortifrúti';
  static ESTOQUE_MINIMO_PADRAO = 20;
}

export class Industrializado extends Produto {
  static NOME: Categoria = 'Industrializado';
  static ESTOQUE_MINIMO_PADRAO = 10;
}

export class Limpeza extends Produto {
  static NOME: Categoria = 'Limpeza';
  static ESTOQUE_MINIMO_PADRAO = 5;
}

// Factory Method: cada creator decide qual Produto instanciar
abstract class ProdutoCreator {
  protected abstract criarProduto(dados: DadosProduto): Produto;

  criar(dados: DadosProduto): Produto {
    this.validar(dados);
    return this.criarProduto(dados);
  }

  private validar({ nome, preco, dataValidade, quantidade, estoqueMinimo }: DadosProduto): void {
    if (!nome.trim()) throw new Error('Informe o nome do produto.');
    if (!Number.isFinite(preco) || preco <= 0) throw new Error('O preço deve ser maior que zero.');
    if (!dataValidade) throw new Error('Informe a data de validade.');
    if (!Number.isInteger(quantidade) || quantidade < 0) throw new Error('Informe uma quantidade válida.');
    if (estoqueMinimo !== undefined && (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0)) {
      throw new Error('O estoque mínimo deve ser um número inteiro não negativo.');
    }
  }
}

class HortifrutiCreator extends ProdutoCreator {
  protected criarProduto(dados: DadosProduto): Produto {
    return new Hortifruti(dados);
  }
}

class IndustrializadoCreator extends ProdutoCreator {
  protected criarProduto(dados: DadosProduto): Produto {
    return new Industrializado(dados);
  }
}

class LimpezaCreator extends ProdutoCreator {
  protected criarProduto(dados: DadosProduto): Produto {
    return new Limpeza(dados);
  }
}

const creators: Record<Categoria, ProdutoCreator> = {
  Hortifrúti: new HortifrutiCreator(),
  Industrializado: new IndustrializadoCreator(),
  Limpeza: new LimpezaCreator(),
};

export function criarProduto(categoria: Categoria, dados: DadosProduto): Produto {
  const creator = creators[categoria];
  if (!creator) throw new Error(`Categoria inválida: ${categoria}`);
  return creator.criar(dados);
}
