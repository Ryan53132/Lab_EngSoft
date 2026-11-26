import { FormEvent, useEffect, useState } from 'react';
import { API_URL } from '../config';

interface Categoria { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; contato?: string; telefone?: string; email?: string; }
interface Produto { id: number; nome: string; }
interface Lote {
  id: number;
  produto_nome: string;
  fornecedor_nome: string;
  numero_lote: string;
  quantidade: number;
  data_validade: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Erro ${response.status} ao acessar ${path}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export default function CadastrosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [categoria, setCategoria] = useState('');
  const [fornecedor, setFornecedor] = useState({ nome: '', contato: '', telefone: '', email: '' });
  const [lote, setLote] = useState({
    produto_id: '',
    fornecedor_id: '',
    numero_lote: '',
    quantidade: '',
    data_validade: '',
  });
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    const [cats, fors, prods, lots] = await Promise.all([
      request<Categoria[]>('/categorias'),
      request<Fornecedor[]>('/fornecedores'),
      request<Produto[]>('/produtos'),
      request<Lote[]>('/lotes'),
    ]);
    setCategorias(cats);
    setFornecedores(fors);
    setProdutos(prods);
    setLotes(lots);
  };

  useEffect(() => {
    void carregar().catch((error: Error) => setErro(error.message));
  }, []);

  const salvarCategoria = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setErro(null);
      await request('/categorias', { method: 'POST', body: JSON.stringify({ nome: categoria }) });
      setCategoria('');
      await carregar();
    } catch (error) { setErro((error as Error).message); }
  };

  const salvarFornecedor = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setErro(null);
      await request('/fornecedores', { method: 'POST', body: JSON.stringify(fornecedor) });
      setFornecedor({ nome: '', contato: '', telefone: '', email: '' });
      await carregar();
    } catch (error) { setErro((error as Error).message); }
  };

  const salvarLote = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setErro(null);
      await request('/lotes', {
        method: 'POST',
        body: JSON.stringify({
          ...lote,
          produto_id: Number(lote.produto_id),
          fornecedor_id: Number(lote.fornecedor_id),
          quantidade: Number(lote.quantidade),
        }),
      });
      setLote({ produto_id: '', fornecedor_id: '', numero_lote: '', quantidade: '', data_validade: '' });
      await carregar();
    } catch (error) { setErro((error as Error).message); }
  };

  const excluirCategoria = async (item: Categoria) => {
    if (!window.confirm(`Excluir a categoria "${item.nome}"?`)) return;
    try {
      setErro(null);
      await request<void>(`/categorias/${item.id}`, { method: 'DELETE' });
      await carregar();
    } catch (error) { setErro((error as Error).message); }
  };

  const excluirFornecedor = async (item: Fornecedor) => {
    if (!window.confirm(`Excluir o fornecedor "${item.nome}"?`)) return;
    try {
      setErro(null);
      await request<void>(`/fornecedores/${item.id}`, { method: 'DELETE' });
      await carregar();
    } catch (error) { setErro((error as Error).message); }
  };

  return (
    <>
      <header><h1>Cadastros secundarios</h1><p>Organize categorias, fornecedores e lotes dos produtos.</p></header>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="cadastros-grid">
        <section className="painel">
          <h2>Nova categoria</h2>
          <form className="form" onSubmit={salvarCategoria}>
            <label>Nome<input value={categoria} onChange={(event) => setCategoria(event.target.value)} required /></label>
            <button>Cadastrar categoria</button>
          </form>
          <ul className="lista">{categorias.map((item) => (
            <li key={item.id}>
              <span>{item.nome}</span>
              <button type="button" className="sec excluir" onClick={() => void excluirCategoria(item)}>Excluir</button>
            </li>
          ))}</ul>
        </section>
        <section className="painel">
          <h2>Novo fornecedor</h2>
          <form className="form" onSubmit={salvarFornecedor}>
            <label>Nome<input value={fornecedor.nome} onChange={(event) => setFornecedor({ ...fornecedor, nome: event.target.value })} required /></label>
            <div className="linha">
              <label>Contato<input value={fornecedor.contato} onChange={(event) => setFornecedor({ ...fornecedor, contato: event.target.value })} /></label>
              <label>Telefone<input value={fornecedor.telefone} onChange={(event) => setFornecedor({ ...fornecedor, telefone: event.target.value })} /></label>
            </div>
            <label>E-mail<input type="email" value={fornecedor.email} onChange={(event) => setFornecedor({ ...fornecedor, email: event.target.value })} /></label>
            <button>Cadastrar fornecedor</button>
          </form>
          <ul className="lista">{fornecedores.map((item) => (
            <li key={item.id}>
              <span>{item.nome}<small>{item.email || item.telefone || 'Sem contato'}</small></span>
              {item.id !== 1 && <button type="button" className="sec excluir" onClick={() => void excluirFornecedor(item)}>Excluir</button>}
            </li>
          ))}</ul>
        </section>
        <section className="painel">
          <h2>Novo lote</h2>
          <form className="form" onSubmit={salvarLote}>
            <label>Produto
              <select value={lote.produto_id} onChange={(event) => setLote({ ...lote, produto_id: event.target.value })} required>
                <option value="">Selecione</option>
                {produtos.map((item) => <option value={item.id} key={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label>Fornecedor
              <select value={lote.fornecedor_id} onChange={(event) => setLote({ ...lote, fornecedor_id: event.target.value })} required>
                <option value="">Selecione</option>
                {fornecedores.map((item) => <option value={item.id} key={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <div className="linha">
              <label>Numero do lote<input value={lote.numero_lote} onChange={(event) => setLote({ ...lote, numero_lote: event.target.value })} required /></label>
              <label>Quantidade<input type="number" min="0" value={lote.quantidade} onChange={(event) => setLote({ ...lote, quantidade: event.target.value })} required /></label>
            </div>
            <label>Validade<input type="date" value={lote.data_validade} onChange={(event) => setLote({ ...lote, data_validade: event.target.value })} required /></label>
            <button>Cadastrar lote</button>
          </form>
          <ul className="lista">{lotes.map((item) => <li key={item.id}><span>{item.produto_nome} - {item.numero_lote}<small>Fornecedor: {item.fornecedor_nome} · Validade: {item.data_validade}</small></span><small>Qtd: {item.quantidade}</small></li>)}</ul>
        </section>
      </div>
    </>
  );
}
