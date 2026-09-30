import { useProdutos } from '../hooks/useLoja';
import ProdutoForm from '../components/ProdutoForm';
import ProdutoTable from '../components/ProdutoTable';
import AlertasPanel from '../components/AlertasPanel';

export default function ProdutosPage() {
  const { produtos, erro, recarregar } = useProdutos();

  return (
    <>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="topo">
        <ProdutoForm onSalvo={recarregar} />
        <AlertasPanel />
      </div>
      <ProdutoTable produtos={produtos} onChange={recarregar} />
    </>
  );
}