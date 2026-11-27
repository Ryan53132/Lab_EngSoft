export type Cargo = 'ADMIN' | 'FUNCIONARIO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string;
  cargo: Cargo;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Usuario;
}

export interface FuncionarioCreatePayload {
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string;
  cargo: Cargo;
  senha: string;
}

export interface FuncionarioUpdatePayload {
  nome?: string;
  email?: string;
  telefone?: string | null;
  cpf?: string;
  cargo?: Cargo;
  senha?: string;
}

export const ehAdmin = (usuario: Usuario | null): boolean =>
  usuario?.cargo === 'ADMIN';
