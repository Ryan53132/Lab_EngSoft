import type { Produto } from './categorias';
import { diasParaVencer } from '../utils';

export interface ResultadoPreco {
  preco: number;
  regra: string;
}

export interface EstrategiaPreco {
  calcular(produto: Produto, quantidade: number): ResultadoPreco;
}

const arredondar = (n: number): number => Math.round(n * 100) / 100;
const normal = (p: Produto): ResultadoPreco => ({ preco: p.preco, regra: 'Preço normal' });

export class PrecoNormal implements EstrategiaPreco {
  calcular(produto: Produto): ResultadoPreco {
    return normal(produto);
  }
}

export class DescontoVencimento implements EstrategiaPreco {
  constructor(
    private readonly diasLimite = 2,
    private readonly percentual = 0.5,
  ) {}

  calcular(produto: Produto): ResultadoPreco {
    if (diasParaVencer(produto.dataValidade) > this.diasLimite) return normal(produto);
    return {
      preco: arredondar(produto.preco * (1 - this.percentual)),
      regra: `Vencimento −${this.percentual * 100}%`,
    };
  }
}

export class DescontoQuantidade implements EstrategiaPreco {
  constructor(
    private readonly minimo = 10,
    private readonly percentual = 0.1,
  ) {}

  calcular(produto: Produto, quantidade: number): ResultadoPreco {
    if (quantidade < this.minimo) return normal(produto);
    return {
      preco: arredondar(produto.preco * (1 - this.percentual)),
      regra: `Quantidade −${this.percentual * 100}%`,
    };
  }
}

// Não acumula descontos: aplica a regra mais vantajosa ao cliente
export class MelhorPreco implements EstrategiaPreco {
  constructor(private readonly estrategias: EstrategiaPreco[]) {}

  calcular(produto: Produto, quantidade: number): ResultadoPreco {
    return this.estrategias
      .map((e) => e.calcular(produto, quantidade))
      .reduce((melhor, atual) => (atual.preco < melhor.preco ? atual : melhor), normal(produto));
  }
}

export class CalculadoraPreco {
  constructor(private estrategia: EstrategiaPreco = new PrecoNormal()) {}

  setEstrategia(estrategia: EstrategiaPreco): void {
    this.estrategia = estrategia;
  }

  calcular(produto: Produto, quantidade = 1): ResultadoPreco {
    return this.estrategia.calcular(produto, quantidade);
  }
}
