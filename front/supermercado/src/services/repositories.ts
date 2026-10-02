import { API_URL, USE_MOCK, FORNECEDOR_PADRAO } from '../config';
import { criarProduto, type Categoria, type Produto } from '../domain/categorias';
import { daquiADias } from '../utils';

export interface ProdutoRepository {
  listar(): Promise<Produto[]>;
  criar(produto: Produto): Promise<Produto>;
  atualizar(produto: Produto): Promise<Produto>;
  atualizarEstoque(id: number, quantidade: number): Promise<Produto>;
  remover(id: number): Promise<void>;
}

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Erro ${res.status} ao acessar ${path}`);
  return (res.status === 204 ? null : await res.json()) as T;
}

class MockProdutoRepository implements ProdutoRepository {
  #dados: Produto[] = [];
  #seq = 0;

  constructor() {
    const seed: [Categoria, string, number, number, number][] = [
      ['Hortifrúti', 'Alface crespa', 4.5, 2, 30],
      ['Hortifrúti', 'Tomate italiano (kg)', 8.9, 6, 18],
      ['Industrializado', 'Macarrão espaguete 500g', 5.99, 120, 60],
      ['Industrializado', 'Iogurte natural 170g', 3.5, 1, 24],
      ['Limpeza', 'Detergente neutro 500ml', 2.79, 400, 40],
    ];
    seed.forEach(([cat, nome, preco, dias, quantidade]) =>
      this.#dados.push(
        criarProduto(cat, { id: ++this.#seq, nome, preco, dataValidade: daquiADias(dias), quantidade }),
      ),
    );
  }

  async listar(): Promise<Produto[]> {
    return [...this.#dados];
  }

  async criar(produto: Produto): Promise<Produto> {
    const salvo = Object.assign(produto, { id: ++this.#seq });
    this.#dados.push(salvo);
    return salvo;
  }

  async atualizar(produto: Produto): Promise<Produto> {
    const i = this.#indice(produto.id);
    this.#dados[i] = produto;
    return produto;
  }

  async atualizarEstoque(id: number, quantidade: number): Promise<Produto> {
    const i = this.#indice(id);
    this.#dados[i] = this.#dados[i].comQuantidade(quantidade);
    return this.#dados[i];
  }

  async remover(id: number): Promise<void> {
    this.#dados.splice(this.#indice(id), 1);
  }

  #indice(id: number): number {
    const i = this.#dados.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Produto não encontrado.');
    return i;
  }
}

interface ProdutoDTO {
  id: number;
  nome: string;
  categoria: { nome: Categoria };
  preco_unitario: number | string;
  quantidade_estoque: number;
  estoque_minimo: number;
  data_validade: string;
}

interface CategoriaDTO {
  id: number;
  nome: string;
}

// Contrato esperado do back: GET/POST /produtos, PUT/PATCH/DELETE /produtos/{id}, GET /categorias.
// data_validade deve vir do lote mais próximo do vencimento (no schema fica em lotes).
class ApiProdutoRepository implements ProdutoRepository {
  #categorias: CategoriaDTO[] | null = null;

  #toDominio = (r: ProdutoDTO): Produto =>
    criarProduto(r.categoria.nome, {
      id: r.id,
      nome: r.nome,
      preco: Number(r.preco_unitario),
      dataValidade: r.data_validade,
      quantidade: r.quantidade_estoque,
      estoqueMinimo: r.estoque_minimo,
    });

  async #categoriaId(nome: string): Promise<number> {
    this.#categorias ??= await http<CategoriaDTO[]>('/categorias');
    const cat = this.#categorias.find((c) => c.nome === nome);
    if (!cat) throw new Error(`Categoria "${nome}" não cadastrada no servidor.`);
    return cat.id;
  }

  async listar(): Promise<Produto[]> {
    return (await http<ProdutoDTO[]>('/produtos')).map(this.#toDominio);
  }

  async #toBody(p: Produto) {
    return {
      nome: p.nome,
      categoria_id: await this.#categoriaId(p.categoria),
      fornecedor_id: FORNECEDOR_PADRAO,
      preco_unitario: p.preco,
      quantidade_estoque: p.quantidade,
      estoque_minimo: p.estoqueMinimo,
      data_validade: p.dataValidade,
    };
  }

  async criar(p: Produto): Promise<Produto> {
    const body = JSON.stringify(await this.#toBody(p));
    return this.#toDominio(await http<ProdutoDTO>('/produtos', { method: 'POST', body }));
  }

  async atualizar(p: Produto): Promise<Produto> {
    const body = JSON.stringify(await this.#toBody(p));
    return this.#toDominio(await http<ProdutoDTO>(`/produtos/${p.id}`, { method: 'PUT', body }));
  }

  async remover(id: number): Promise<void> {
    await http<null>(`/produtos/${id}`, { method: 'DELETE' });
  }

  async atualizarEstoque(id: number, quantidade: number): Promise<Produto> {
    const r = await http<ProdutoDTO>(`/produtos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantidade_estoque: quantidade }),
    });
    return this.#toDominio(r);
  }
}

export const createRepository = (): ProdutoRepository =>
  USE_MOCK ? new MockProdutoRepository() : new ApiProdutoRepository();