import { useState, type ChangeEvent, type FormEvent } from 'react';
import { loja } from '../services/LojaFacade';
import { CATEGORIAS, type Categoria, type Produto } from '../domain/categorias';
import { mensagemErro } from '../utils';

interface Campos {
  nome: string;
  categoria: Categoria;
  preco: string;
  dataValidade: string;
  quantidade: string;
  estoqueMinimo: string;
}

interface ProdutoFormProps {
  inicial?: Produto;
  onSalvo: () => void;
  onCancelar: () => void;
}

const vazio: Campos = { nome: '', categoria: CATEGORIAS[0], preco: '', dataValidade: '', quantidade: '', estoqueMinimo: '' };
const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

const paraCampos = (p?: Produto): Campos =>
  p
    ? {
        nome: p.nome,
        categoria: p.categoria,
        preco: String(p.preco),
        dataValidade: p.dataValidade,
        quantidade: String(p.quantidade),
        estoqueMinimo: String(p.estoqueMinimo),
      }
    : vazio;

export default function ProdutoForm({ inicial, onSalvo, onCancelar }: ProdutoFormProps) {
  const [f, setF] = useState<Campos>(() => paraCampos(inicial));
  const [erro, setErro] = useState<string | null>(null);
  const set = (campo: Exclude<keyof Campos, 'categoria'>) => (e: ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [campo]: e.target.value });

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const dados = {
        categoria: f.categoria,
        nome: f.nome,
        preco: num(f.preco),
        dataValidade: f.dataValidade,
        quantidade: num(f.quantidade),
        estoqueMinimo: f.estoqueMinimo === '' ? undefined : num(f.estoqueMinimo),
      };
      if (inicial) await loja.editarProduto(inicial.id, dados);
      else await loja.cadastrarProduto(dados);
      onSalvo();
    } catch (err) {
      setErro(mensagemErro(err));
    }
  };

  return (
    <form className="form" onSubmit={salvar}>
      <label>Nome<input value={f.nome} onChange={set('nome')} autoFocus /></label>
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
      <div className="botoes">
        <button type="button" className="sec" onClick={onCancelar}>Cancelar</button>
        <button type="submit">{inicial ? 'Salvar alterações' : 'Cadastrar produto'}</button>
      </div>
    </form>
  );
}