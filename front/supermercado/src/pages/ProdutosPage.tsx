import { useCallback, useMemo, useState } from 'react';
import { useProdutos, usePromocoesManuais } from '../hooks/useLoja';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { FILTROS_INICIAIS, type Filtros, type Situacao } from '../domain/filtros';
import { DIAS_ALERTA_VENCIMENTO } from '../domain/observers';
import { diasParaVencer } from '../utils';
import Modal from '../components/Modal';
import ProdutoForm from '../components/ProdutoForm';
import ProdutoFiltros from '../components/ProdutoFiltros';
import ProdutoTable from '../components/ProdutoTable';
import AlertasPanel from '../components/AlertasPanel';
import ConfirmarExclusao from '../components/ConfirmarExclusao';
import PromocoesManuaisPanel from '../components/PromocoesManuaisPanel';

type ModalAberto =
  | { tipo: 'form'; produto?: Produto }
  | { tipo: 'excluir'; produto: Produto }
  | null;

export default function ProdutosPage() {
  const { produtos, erro, recarregar } = useProdutos();
  const promocoesManuais = usePromocoesManuais();
  const [modal, setModal] = useState<ModalAberto>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);

  const visiveis = useMemo(
    () => loja.filtrarProdutos(produtos, filtros),
    [produtos, filtros, promocoesManuais],
  );

  const resumo = useMemo(() => {
    let reposicao = 0;
    let vencimento = 0;
    let promocao = 0;

    for (const p of produtos) {
      if (p.quantidade <= p.estoqueMinimo) reposicao += 1;
      if (diasParaVencer(p.dataValidade) < DIAS_ALERTA_VENCIMENTO) vencimento += 1;
      if (loja.calcularPreco(p).preco < p.preco) promocao += 1;
    }

    return {
      total: produtos.length,
      reposicao,
      vencimento,
      promocao,
    };
  }, [produtos, promocoesManuais]);

  const alternarSituacao = (situacao: Situacao) => {
    setFiltros((atual) => ({
      ...atual,
      situacao: atual.situacao === situacao ? 'todas' : situacao,
    }));
  };

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
      <header className="pagina-cabecalho">
        <div>
          <h1>Produtos</h1>
          <p>Gerencie, cadastre e acompanhe os produtos em estoque.</p>
        </div>
        <button onClick={() => setModal({ tipo: 'form' })}>+ Cadastrar produto</button>
      </header>

      <section className="resumo-grid" aria-label="Resumo do estoque">
        <button
          type="button"
          className={`resumo-card${filtros.situacao === 'todas' ? ' ativo' : ''}`}
          onClick={() => setFiltros({ ...filtros, situacao: 'todas' })}
        >
          <span>Total de produtos</span>
          <strong>{resumo.total}</strong>
        </button>

        <button
          type="button"
          className={`resumo-card${resumo.reposicao > 0 ? ' critico' : ''}${filtros.situacao === 'reposicao' ? ' ativo' : ''}`}
          onClick={() => alternarSituacao('reposicao')}
        >
          <span>Reposição necessária</span>
          <strong>{resumo.reposicao}</strong>
        </button>

        <button
          type="button"
          className={`resumo-card${resumo.vencimento > 0 ? ' critico' : ''}${filtros.situacao === 'vencimento' ? ' ativo' : ''}`}
          onClick={() => alternarSituacao('vencimento')}
        >
          <span>Perto do vencimento</span>
          <strong>{resumo.vencimento}</strong>
        </button>

        <button
          type="button"
          className={`resumo-card${resumo.promocao > 0 ? ' destaque-promo' : ''}${filtros.situacao === 'promocao' ? ' ativo' : ''}`}
          onClick={() => alternarSituacao('promocao')}
        >
          <span>Em promoção</span>
          <strong>{resumo.promocao}</strong>
        </button>
      </section>

      {erro && <p className="erro" role="alert">{erro}</p>}
      <AlertasPanel />

      <section className="painel painel-produtos">
        <div className="barra barra-produtos">
          <ProdutoFiltros filtros={filtros} onChange={setFiltros} />
          <span className="barra-contagem">
            {visiveis.length} de {produtos.length} produto(s)
          </span>
        </div>
        <ProdutoTable
          produtos={visiveis}
          textoVazio={textoVazio}
          onChange={recarregar}
          onEditar={editar}
          onExcluir={excluir}
        />
      </section>

      <PromocoesManuaisPanel produtos={produtos} />

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
