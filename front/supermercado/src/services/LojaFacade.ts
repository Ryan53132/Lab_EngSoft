import { criarProduto, type NovoProduto, type Produto } from '../domain/categorias';
import {
  CalculadoraPreco,
  MelhorPreco,
  DescontoVencimento,
  DescontoQuantidade,
  DescontoManual,
  type EstrategiaPreco,
  type NovaPromocaoManual,
  type PromocaoManual,
  type ResultadoPreco,
} from '../domain/precos';
import {
  EstoqueSubject, AlertaCenter, ReposicaoObserver, VencimentoObserver, DIAS_ALERTA_VENCIMENTO,
} from '../domain/observers';
import type { Filtros, Situacao } from '../domain/filtros';
import { diasParaVencer, normalizar } from '../utils';
import { createRepository, type ProdutoRepository } from './repositories';

const PROMOCOES_STORAGE_KEY = 'supermercado:promocoes_manuais';

function carregarPromocoesSalvas(): PromocaoManual[] {
  try {
    const bruto = localStorage.getItem(PROMOCOES_STORAGE_KEY);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as PromocaoManual[]) : [];
  } catch {
    return [];
  }
}

// Facade: única porta de entrada da UI para produtos, preços e alertas
export class LojaFacade {
  readonly alertas = new AlertaCenter();
  private readonly estoque = new EstoqueSubject();
  private readonly descontoManual = new DescontoManual();
  private promocoessSnapshot: readonly PromocaoManual[] = carregarPromocoesSalvas();
  private promocoesListeners = new Set<() => void>();

  constructor(
    private readonly repo: ProdutoRepository = createRepository(),
    private readonly calculadora = new CalculadoraPreco(),
  ) {
    this.descontoManual.definirPromocoes([...this.promocoessSnapshot]);
    this.calculadora.setEstrategia(
      new MelhorPreco([
        new DescontoVencimento(),
        new DescontoQuantidade(),
        this.descontoManual,
      ]),
    );
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
    if (this.promocoessSnapshot.some((p) => p.escopo === 'produto' && p.produtoId === produto.id)) {
      this.#atualizarPromocoes(
        this.promocoessSnapshot.filter(
          (p) => !(p.escopo === 'produto' && p.produtoId === produto.id),
        ),
      );
    }
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

  subscribePromocoes = (listener: () => void): (() => void) => {
    this.promocoesListeners.add(listener);
    return () => {
      this.promocoesListeners.delete(listener);
    };
  };

  getPromocoesSnapshot = (): readonly PromocaoManual[] => this.promocoessSnapshot;

  criarPromocaoManual(dados: NovaPromocaoManual): PromocaoManual {
    if (!Number.isFinite(dados.percentual) || dados.percentual <= 0 || dados.percentual > 90) {
      throw new Error('Informe um desconto entre 1% e 90%.');
    }
    if (dados.escopo === 'produto' && !dados.produtoId) {
      throw new Error('Selecione um produto para a promoção.');
    }
    if (dados.escopo === 'categoria' && !dados.categoria) {
      throw new Error('Selecione uma categoria para a promoção.');
    }

    const chaveAlvo =
      dados.escopo === 'produto'
        ? `produto:${dados.produtoId}`
        : dados.escopo === 'categoria'
          ? `categoria:${dados.categoria}`
          : 'todos';

    const nova: PromocaoManual = {
      id: chaveAlvo,
      escopo: dados.escopo,
      produtoId: dados.produtoId,
      produtoNome: dados.produtoNome,
      categoria: dados.categoria,
      percentual: Math.round(dados.percentual),
      titulo: dados.titulo?.trim() || 'Promoção manual',
      criadaEm: new Date().toISOString(),
    };

    const filtradas = this.promocoessSnapshot.filter((item) => item.id !== chaveAlvo);
    this.#atualizarPromocoes([nova, ...filtradas]);
    return nova;
  }

  pararPromocaoManual(id: string): void {
    this.#atualizarPromocoes(this.promocoessSnapshot.filter((item) => item.id !== id));
  }

  pararTodasPromocoesManuais(): void {
    this.#atualizarPromocoes([]);
  }

  #atualizarPromocoes(lista: PromocaoManual[]): void {
    this.promocoessSnapshot = lista;
    this.descontoManual.definirPromocoes(lista);
    try {
      localStorage.setItem(PROMOCOES_STORAGE_KEY, JSON.stringify(lista));
    } catch {
      // Ignora erro de armazenamento local
    }
    this.promocoesListeners.forEach((listener) => listener());
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
