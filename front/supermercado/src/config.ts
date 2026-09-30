export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
// fornecedor_id é obrigatório no schema; trocar quando houver tela de fornecedores
export const FORNECEDOR_PADRAO = 1;
