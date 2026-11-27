import { useState, type FormEvent } from 'react';
import { CATEGORIAS, type Categoria, type Produto } from '../domain/categorias';
import type { PromocaoManual } from '../domain/precos';
import { usePromocoesManuais } from '../hooks/useLoja';
import { loja } from '../services/LojaFacade';
import { mensagemErro } from '../utils';

interface PromocoesManuaisPanelProps {
  produtos: Produto[];
}

function descricaoAlvo(promocao: PromocaoManual): string {
  if (promocao.escopo === 'todos') return 'Todos os produtos';
  if (promocao.escopo === 'categoria') return `Categoria: ${promocao.categoria}`;
  return promocao.produtoNome ?? `Produto #${promocao.produtoId}`;
}

export default function PromocoesManuaisPanel({ produtos }: PromocoesManuaisPanelProps) {
  const promocoes = usePromocoesManuais();
  const [alvo, setAlvo] = useState('');
  const [percentual, setPercentual] = useState('');
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const criar = (event: FormEvent) => {
    event.preventDefault();
    setErro(null);

    try {
      if (!alvo) {
        throw new Error('Selecione onde aplicar a promoção.');
      }

      const desconto = Number(percentual);
      if (alvo === 'todos') {
        loja.criarPromocaoManual({ escopo: 'todos', percentual: desconto, titulo });
      } else if (alvo.startsWith('categoria:')) {
        const categoria = alvo.slice('categoria:'.length) as Categoria;
        loja.criarPromocaoManual({ escopo: 'categoria', categoria, percentual: desconto, titulo });
      } else if (alvo.startsWith('produto:')) {
        const produtoId = Number(alvo.slice('produto:'.length));
        const produto = produtos.find((item) => item.id === produtoId);
        loja.criarPromocaoManual({
          escopo: 'produto',
          produtoId,
          produtoNome: produto?.nome,
          percentual: desconto,
          titulo,
        });
      }

      setAlvo('');
      setPercentual('');
      setTitulo('');
    } catch (e) {
      setErro(mensagemErro(e));
    }
  };

  return (
    <section className="painel promocoes-painel" aria-labelledby="titulo-promocoes-manuais">
      <div className="promocoes-topo">
        <div>
          <h2 id="titulo-promocoes-manuais">
            Promoções manuais
            <span className={`contador${promocoes.length ? ' promo-ativo' : ''}`}>
              {promocoes.length}
            </span>
          </h2>
          <p className="promocoes-subtitulo">
            Crie descontos imediatos por produto, categoria ou para toda a loja e encerre quando quiser.
          </p>
        </div>

        {promocoes.length > 0 && (
          <button
            type="button"
            className="sec excluir"
            onClick={() => loja.pararTodasPromocoesManuais()}
          >
            Parar todas
          </button>
        )}
      </div>

      <form className="promocoes-form" onSubmit={criar}>
        <label>
          Aplicar em
          <select value={alvo} onChange={(e) => setAlvo(e.target.value)}>
            <option value="">Selecione um produto ou grupo</option>
            <optgroup label="Geral">
              <option value="todos">Todos os produtos</option>
            </optgroup>
            <optgroup label="Por categoria">
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={`categoria:${cat}`}>
                  Categoria: {cat}
                </option>
              ))}
            </optgroup>
            {produtos.length > 0 && (
              <optgroup label="Produto específico">
                {produtos.map((produto) => (
                  <option key={produto.id} value={`produto:${produto.id}`}>
                    {produto.nome}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <label>
          Desconto (%)
          <input
            type="number"
            min={1}
            max={90}
            placeholder="Ex: 20"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
          />
        </label>

        <label>
          Rótulo da promoção (opcional)
          <input
            type="text"
            maxLength={40}
            placeholder="Ex: Oferta do dia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>

        <button type="submit">Criar promoção</button>
      </form>

      {erro && (
        <p className="erro promocoes-erro" role="alert">
          {erro}
        </p>
      )}

      {promocoes.length === 0 ? (
        <p className="vazio">Nenhuma promoção manual ativa no momento.</p>
      ) : (
        <ul className="promocoes-lista">
          {promocoes.map((promo) => (
            <li key={promo.id} className="promocao-item">
              <div className="promocao-info">
                <span className="etiqueta promo">-{promo.percentual}%</span>
                <div>
                  <strong>{descricaoAlvo(promo)}</strong>
                  <small>{promo.titulo}</small>
                </div>
              </div>
              <button
                type="button"
                className="sec excluir"
                onClick={() => loja.pararPromocaoManual(promo.id)}
              >
                Parar promoção
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
