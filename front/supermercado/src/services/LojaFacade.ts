import { criarProduto, type NovoProduto, type Produto } from '../domain/categorias';
import {
  CalculadoraPreco, MelhorPreco, DescontoVencimento, DescontoQuantidade,
  type EstrategiaPreco, type ResultadoPreco,
} from '../domain/precos';
import {
  EstoqueSubject, AlertaCenter, ReposicaoObserver, VencimentoObserver, DIAS_ALERTA_VENCIMENTO,
} from '../domain/observers';
import type { Filtros, Situacao } from '../domain/filtros';
import { diasParaVencer, normalizar } from '../utils';
import { createRepository, type ProdutoRepository } from './repositories';

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

  async editarProduto(id: number, { categoria, ...dados }: NovoProduto): Promise<Produto> {
    const atualizado = await this.repo.atualizar(criarProduto(categoria, { ...dados, id }));
    this.estoque.notify(atualizado);
    return atualizado;
  }

  async removerProduto(produto: Produto): Promise<void> {
    await this.repo.remover(produto.id);
    this.alertas.removerDoProduto(produto.id);
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

  filtrarProdutos(produtos: Produto[], { busca, categoria, situacao }: Filtros): Produto[] {
    const termo = normalizar(busca.trim());
    return produtos.filter(
      (p) =>
        normalizar(p.nome).includes(termo) &&
        (categoria === 'todas' || p.categoria === categoria) &&
        this.#casaSituacao(p, situacao),
    );
  }

  #casaSituacao(p: Produto, situacao: Situacao): boolean {
    switch (situacao) {
      case 'vencimento':
        return diasParaVencer(p.dataValidade) < DIAS_ALERTA_VENCIMENTO;
      case 'promocao':
        return this.calcularPreco(p).preco < p.preco;
      case 'reposicao':
        return p.quantidade <= p.estoqueMinimo;
      default:
        return true;
    }
  }
}

export const loja = new LojaFacade();