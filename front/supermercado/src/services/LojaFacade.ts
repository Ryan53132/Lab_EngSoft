import { criarProduto, type NovoProduto, type Produto } from '../domain/categorias';
import {
  CalculadoraPreco, MelhorPreco, DescontoVencimento, DescontoQuantidade,
  type EstrategiaPreco, type ResultadoPreco,
} from '../domain/precos';
import { EstoqueSubject, AlertaCenter, ReposicaoObserver, VencimentoObserver } from '../domain/observers';
import { createRepository, type ProdutoRepository } from '../hooks/repositories';

// Facade: única porta de entrada da UI para produtos, preços e alertas
export class LojaFacade {
  readonly alertas = new AlertaCenter();
  private readonly estoque = new EstoqueSubject();

  constructor(
    private readonly repo: ProdutoRepository = createRepository(),
    private readonly calculadora = new CalculadoraPreco(
      new MelhorPreco([new DescontoVencimento(), new DescontoQuantidade()]),
    ),
  ) {
    this.estoque.subscribe(new ReposicaoObserver(this.alertas));
    this.estoque.subscribe(new VencimentoObserver(this.alertas));
  }

  async listarProdutos(): Promise<Produto[]> {
    const produtos = await this.repo.listar();
    produtos.forEach((p) => this.estoque.notify(p));
    return produtos;
  }

  async cadastrarProduto({ categoria, ...dados }: NovoProduto): Promise<Produto> {
    const salvo = await this.repo.criar(criarProduto(categoria, dados));
    this.estoque.notify(salvo);
    return salvo;
  }

  async movimentarEstoque(produto: Produto, delta: number): Promise<Produto> {
    const nova = produto.quantidade + delta;
    if (nova < 0) throw new Error('Estoque insuficiente.');
    const atualizado = await this.repo.atualizarEstoque(produto.id, nova);
    this.estoque.notify(atualizado);
    return atualizado;
  }

  calcularPreco(produto: Produto, quantidade = 1): ResultadoPreco {
    return this.calculadora.calcular(produto, quantidade);
  }

  trocarRegraPreco(estrategia: EstrategiaPreco): void {
    this.calculadora.setEstrategia(estrategia);
  }
}

export const loja = new LojaFacade();
