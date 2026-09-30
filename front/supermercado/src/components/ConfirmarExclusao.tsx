import { useState } from 'react';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { mensagemErro } from '../utils';

interface ConfirmarExclusaoProps {
  produto: Produto;
  onExcluido: () => void;
  onCancelar: () => void;
}

export default function ConfirmarExclusao({ produto, onExcluido, onCancelar }: ConfirmarExclusaoProps) {
  const [erro, setErro] = useState<string | null>(null);

  const excluir = async () => {
    try {
      await loja.removerProduto(produto);
      onExcluido();
    } catch (e) {
      setErro(mensagemErro(e));
    }
  };

  return (
    <>
      <p>Deseja excluir <strong>{produto.nome}</strong>? Essa ação não pode ser desfeita.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="botoes">
        <button className="sec" onClick={onCancelar}>Cancelar</button>
        <button className="perigo" onClick={() => void excluir()}>Excluir</button>
      </div>
    </>
  );
}