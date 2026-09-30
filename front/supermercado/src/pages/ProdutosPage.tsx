import { useCallback, useMemo, useState } from 'react';
import { useProdutos } from '../hooks/useLoja';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { FILTROS_INICIAIS, type Filtros } from '../domain/filtros';
import Modal from '../components/Modal';
import ProdutoForm from '../components/ProdutoForm';
import ProdutoFiltros from '../components/ProdutoFiltros';
import ProdutoTable from '../components/ProdutoTable';
import AlertasPanel from '../components/AlertasPanel';
import ConfirmarExclusao from '../components/ConfirmarExclusao';

type ModalAberto =
  | { tipo: 'form'; produto?: Produto }
  | { tipo: 'excluir'; produto: Produto }
  | null;

export default function ProdutosPage() {
  const { produtos, erro, recarregar } = useProdutos();
  const [modal, setModal] = useState<ModalAberto>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);

  const visiveis = useMemo(() => loja.filtrarProdutos(produtos, filtros), [produtos, filtros]);

  const fechar = () => setModal(null);
  const concluir = () => {
    fechar();
    void recarregar();
  };
  const editar = useCallback((produto: Produto) => setModal({ tipo: 'form', produto }), []);
  const excluir = useCallback((produto: Produto) => setModal({ tipo: 'excluir', produto }), []);

  const textoVazio = produtos.length
    ? 'Nenhum produto encontrado com esses filtros.'
    : 'Nenhum produto cadastrado. Use o botão Cadastrar produto para adicionar o primeiro.';

  return (
    <>
      <header>
        <h1>Produtos</h1>
        <p>Gerencie, cadastre e acompanhe os produtos em estoque.</p>
      </header>

      {erro && <p className="erro" role="alert">{erro}</p>}
      <AlertasPanel />

      <section className="painel">
        <div className="barra">
          <ProdutoFiltros filtros={filtros} onChange={setFiltros} />
          <button onClick={() => setModal({ tipo: 'form' })}>Cadastrar produto</button>
        </div>
        <ProdutoTable
          produtos={visiveis}
          textoVazio={textoVazio}
          onChange={recarregar}
          onEditar={editar}
          onExcluir={excluir}
        />
      </section>

      {modal?.tipo === 'form' && (
        <Modal titulo={modal.produto ? 'Editar produto' : 'Cadastrar produto'} onFechar={fechar}>
          <ProdutoForm inicial={modal.produto} onSalvo={concluir} onCancelar={fechar} />
        </Modal>
      )}
      {modal?.tipo === 'excluir' && (
        <Modal titulo="Excluir produto" onFechar={fechar}>
          <ConfirmarExclusao produto={modal.produto} onExcluido={concluir} onCancelar={fechar} />
        </Modal>
      )}
    </>
  );
}