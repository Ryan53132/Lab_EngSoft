export const hoje = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const parseData = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const diasParaVencer = (iso: string): number =>
  Math.round((parseData(iso).getTime() - hoje().getTime()) / 86400000);

export const daquiADias = (n: number): string => {
  const d = hoje();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (v: number): string => brl.format(v);
export const formatData = (iso: string): string => parseData(iso).toLocaleDateString('pt-BR');

export const mensagemErro = (e: unknown): string =>
  e instanceof Error ? e.message : 'Erro inesperado.';
