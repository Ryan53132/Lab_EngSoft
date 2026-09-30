import { useState, type ChangeEvent, type FormEvent } from 'react';
import { loja } from '../services/LojaFacade';
import { CATEGORIAS, type Categoria } from '../domain/categorias';
import { mensagemErro } from '../utils';

interface Campos {
  nome: string;
  categoria: Categoria;
  preco: string;
  dataValidade: string;
  quantidade: string;
  estoqueMinimo: string;
}

const vazio: Campos = { nome: '', categoria: CATEGORIAS[0], preco: '', dataValidade: '', quantidade: '', estoqueMinimo: '' };
const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

export default function ProdutoForm({ onSalvo }: { onSalvo: () => void }) {
  const [f, setF] = useState<Campos>(vazio);
  const [erro, setErro] = useState<string | null>(null);
  const set = (campo: Exclude<keyof Campos, 'categoria'>) => (e: ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [campo]: e.target.value });

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await loja.cadastrarProduto({
        categoria: f.categoria,
        nome: f.nome,
        preco: num(f.preco),
        dataValidade: f.dataValidade,
        quantidade: num(f.quantidade),
        estoqueMinimo: f.estoqueMinimo === '' ? undefined : num(f.estoqueMinimo),
      });
      setF(vazio);
      setErro(null);
      onSalvo();
    } catch (err) {
      setErro(mensagemErro(err));
    }
  };

  return (
    <form className="painel form" onSubmit={salvar}>
      <h2>Novo produto</h2>
      <label>Nome<input value={f.nome} onChange={set('nome')} /></label>
      <label>Categoria
        <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <div className="linha">
        <label>Preço (R$)<input type="number" step="0.01" min="0" value={f.preco} onChange={set('preco')} /></label>
        <label>Quantidade<input type="number" min="0" value={f.quantidade} onChange={set('quantidade')} /></label>
      </div>
      <div className="linha">
        <label>Validade<input type="date" value={f.dataValidade} onChange={set('dataValidade')} /></label>
        <label>Estoque mínimo<input type="number" min="0" placeholder="Padrão da categoria" value={f.estoqueMinimo} onChange={set('estoqueMinimo')} /></label>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button type="submit">Cadastrar produto</button>
    </form>
  );
}
