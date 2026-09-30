import type { Produto } from './categorias';
import { diasParaVencer } from '../utils';

export type TipoAlerta = 'REPOSICAO' | 'QUEIMA';

export interface Alerta {
  tipo: TipoAlerta;
  produtoId: number;
  mensagem: string;
}

export interface AlertaAtivo extends Alerta {
  key: string;
  em: Date;
}

export interface Observer<T> {
  update(dado: T): void;
}

export class Subject<T> {
  #observers = new Set<Observer<T>>();

  subscribe(observer: Observer<T>): () => void {
    this.#observers.add(observer);
    return () => {
      this.#observers.delete(observer);
    };
  }

  notify(dado: T): void {
    this.#observers.forEach((o) => o.update(dado));
  }
}

export class EstoqueSubject extends Subject<Produto> {}

// Guarda os alertas ativos e expõe snapshot para a UI (useSyncExternalStore)
export class AlertaCenter {
  #alertas = new Map<string, AlertaAtivo>();
  #listeners = new Set<() => void>();
  #snapshot: readonly AlertaAtivo[] = [];

  abrir(alerta: Alerta): void {
    const key = `${alerta.tipo}:${alerta.produtoId}`;
    if (this.#alertas.has(key)) return;
    this.#alertas.set(key, { ...alerta, key, em: new Date() });
    console.warn(`[${alerta.tipo}] ${alerta.mensagem}`);
    this.#emitir();
  }

  fechar(tipo: TipoAlerta, produtoId: number): void {
    if (this.#alertas.delete(`${tipo}:${produtoId}`)) this.#emitir();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = (): readonly AlertaAtivo[] => this.#snapshot;

  #emitir(): void {
    this.#snapshot = [...this.#alertas.values()];
    this.#listeners.forEach((l) => l());
  }
}

export class ReposicaoObserver implements Observer<Produto> {
  constructor(private readonly central: AlertaCenter) {}

  update(p: Produto): void {
    if (p.quantidade <= p.estoqueMinimo) {
      this.central.abrir({
        tipo: 'REPOSICAO',
        produtoId: p.id,
        mensagem: `Reposição Necessária: ${p.nome} (${p.quantidade} em estoque, mínimo ${p.estoqueMinimo})`,
      });
    } else {
      this.central.fechar('REPOSICAO', p.id);
    }
  }
}

export class VencimentoObserver implements Observer<Produto> {
  constructor(
    private readonly central: AlertaCenter,
    private readonly diasLimite = 3,
  ) {}

  update(p: Produto): void {
    const dias = diasParaVencer(p.dataValidade);
    if (dias < this.diasLimite) {
      const situacao = dias < 0 ? 'vencido' : `vence em ${dias} dia(s)`;
      this.central.abrir({
        tipo: 'QUEIMA',
        produtoId: p.id,
        mensagem: `Produto em Cartaz (Queima de Estoque): ${p.nome} — ${situacao}`,
      });
    } else {
      this.central.fechar('QUEIMA', p.id);
    }
  }
}
