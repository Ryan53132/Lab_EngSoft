import { useMemo, useState } from 'react';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import '@inovua/reactdatagrid-community/index.css';
import type { TypeColumn } from '@inovua/reactdatagrid-community/types';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { diasParaVencer, formatBRL, formatData, mensagemErro } from '../utils';

interface CelulaProps {
  principal: string;
  secundario: string;
  critico?: boolean;
}

const Celula = ({ principal, secundario, critico }: CelulaProps) => (
  <div className={`celula${critico ? ' critico' : ''}`}>
    {principal}
    <small>{secundario}</small>
  </div>
);

function VendaCell({ produto, onChange }: { produto: Produto; onChange: () => void }) {
  const [qtd, setQtd] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const { preco, regra } = loja.calcularPreco(produto, qtd);

  const mover = async (sinal: 1 | -1) => {
    try {
      await loja.movimentarEstoque(produto, sinal * qtd);
      setErro(null);
      onChange();
    } catch (e) {
      setErro(mensagemErro(e));
    }
  };

  return (
    <div className="venda">
      <div className="acoes">
        <input
          type="number"
          min={1}
          value={qtd}
          aria-label="Quantidade"
          onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))}
        />
        <button onClick={() => void mover(-1)}>Vender</button>
        <button className="sec" onClick={() => void mover(1)}>Repor</button>
        <span className={preco < produto.preco ? 'etiqueta promo' : 'etiqueta'}>{formatBRL(preco)}</span>
      </div>
      <small className={erro ? 'erro' : ''}>
        {erro ?? `${regra} · total ${formatBRL(preco * qtd)}`}
      </small>
    </div>
  );
}

const criarColunas = (onChange: () => void): TypeColumn[] => [
  { name: 'nome', header: 'Produto', defaultFlex: 2, minWidth: 170 },
  { name: 'categoria', header: 'Categoria', defaultFlex: 1, minWidth: 130 },
  {
    name: 'dataValidade',
    header: 'Validade',
    minWidth: 120,
    render: ({ data }: { data: Produto }) => {
      const dias = diasParaVencer(data.dataValidade);
      return (
        <Celula
          principal={formatData(data.dataValidade)}
          secundario={dias < 0 ? 'vencido' : `${dias} dia(s)`}
          critico={dias < 3}
        />
      );
    },
  },
  {
    name: 'quantidade',
    header: 'Estoque',
    type: 'number',
    minWidth: 100,
    render: ({ data }: { data: Produto }) => (
      <Celula
        principal={String(data.quantidade)}
        secundario={`mín. ${data.estoqueMinimo}`}
        critico={data.quantidade <= data.estoqueMinimo}
      />
    ),
  },
  {
    name: 'preco',
    header: 'Preço',
    type: 'number',
    minWidth: 100,
    render: ({ value }: { value: number }) => formatBRL(value),
  },
  {
    name: 'venda',
    header: 'Venda',
    sortable: false,
    defaultFlex: 2,
    minWidth: 340,
    render: ({ data }: { data: Produto }) => <VendaCell produto={data} onChange={onChange} />,
  },
];

export default function ProdutoTable({ produtos, onChange }: { produtos: Produto[]; onChange: () => void }) {
  const colunas = useMemo(() => criarColunas(onChange), [onChange]);

  return (
    <section className="painel">
      <h2>Produtos</h2>
      <ReactDataGrid
        idProperty="id"
        columns={colunas}
        dataSource={produtos}
        rowHeight={64}
        theme="default-light"
        style={{ minHeight: 420 }}
        emptyText="Nenhum produto cadastrado. Use o formulário para adicionar o primeiro."
      />
    </section>
  );
}
