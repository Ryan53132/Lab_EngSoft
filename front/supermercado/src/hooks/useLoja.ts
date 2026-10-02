import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { loja } from '../services/LojaFacade';
import type { Produto } from '../domain/categorias';
import { mensagemErro } from '../utils';

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setProdutos(await loja.listarProdutos());
      setErro(null);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { produtos, erro, recarregar };
}

export const useAlertas = () =>
  useSyncExternalStore(loja.alertas.subscribe, loja.alertas.getSnapshot);
