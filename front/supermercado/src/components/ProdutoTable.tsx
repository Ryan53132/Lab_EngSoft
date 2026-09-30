import { useMemo, useState } from 'react';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import '@inovua/reactdatagrid-community/index.css';
import type { TypeColumn } from '@inovua/reactdatagrid-community/types';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { DIAS_ALERTA_VENCIMENTO } from '../domain/observers';
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
      </div>
      <div className="preco-linha">
        <span className={preco < produto.preco ? 'etiqueta promo' : 'etiqueta'}>{formatBRL(preco)}</span>
        <small className={erro ? 'erro' : ''}>{erro ?? `${regra} · total ${formatBRL(preco * qtd)}`}</small>
      </div>
    </div>
  );
}

interface Handlers {
  onChange: () => void;
  onEditar: (p: Produto) => void;
  onExcluir: (p: Produto) => void;
}

const criarColunas = ({ onChange, onEditar, onExcluir }: Handlers): TypeColumn[] => [
  { name: 'nome', header: 'Produto', defaultFlex: 2, minWidth: 120 },
  { name: 'categoria', header: 'Categoria', defaultFlex: 1, minWidth: 115 },
  {
    name: 'dataValidade',
    header: 'Validade',
    defaultFlex: 1,
    minWidth: 100,
    render: ({ data }: { data: Produto }) => {
      const dias = diasParaVencer(data.dataValidade);
      return (
        <Celula
          principal={formatData(data.dataValidade)}
          secundario={dias < 0 ? 'vencido' : `${dias} dia(s)`}
          critico={dias < DIAS_ALERTA_VENCIMENTO}
        />
      );
    },
  },
  {
    name: 'quantidade',
    header: 'Estoque',
    type: 'number',
    defaultFlex: 1,
    minWidth: 85,
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
    defaultFlex: 1,
    minWidth: 90,
    render: ({ value }: { value: number }) => formatBRL(value),
  },
  {
    name: 'venda',
    header: 'Venda',
    sortable: false,
    defaultFlex: 2,
    minWidth: 240,
    render: ({ data }: { data: Produto }) => <VendaCell produto={data} onChange={onChange} />,
  },
  {
    name: 'acoes',
    header: 'Ações',
    sortable: false,
    minWidth: 150,
    render: ({ data }: { data: Produto }) => (
      <div className="acoes">
        <button className="sec" onClick={() => onEditar(data)}>Editar</button>
        <button className="sec excluir" onClick={() => onExcluir(data)}>Excluir</button>
      </div>
    ),
  },
];

interface ProdutoTableProps extends Handlers {
  produtos: Produto[];
  textoVazio: string;
}

export default function ProdutoTable({ produtos, textoVazio, onChange, onEditar, onExcluir }: ProdutoTableProps) {
  const colunas = useMemo(
    () => criarColunas({ onChange, onEditar, onExcluir }),
    [onChange, onEditar, onExcluir],
  );

  return (
    <ReactDataGrid
      idProperty="id"
      columns={colunas}
      dataSource={produtos}
      rowHeight={72}
      theme="default-light"
      style={{ minHeight: 420 }}
      emptyText={textoVazio}
    />
  );
}