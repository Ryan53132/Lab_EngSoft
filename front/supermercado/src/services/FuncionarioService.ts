import type {
  FuncionarioCreatePayload,
  FuncionarioUpdatePayload,
  Usuario,
} from '../domain/auth';
import { apiRequest } from './AuthService';

export async function listarFuncionarios(): Promise<Usuario[]> {
  return apiRequest<Usuario[]>('/funcionarios');
}

export async function criarFuncionario(
  dados: FuncionarioCreatePayload,
): Promise<Usuario> {
  return apiRequest<Usuario>('/funcionarios', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function atualizarFuncionario(
  id: number,
  dados: FuncionarioUpdatePayload,
): Promise<Usuario> {
  return apiRequest<Usuario>(`/funcionarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export async function excluirFuncionario(id: number): Promise<void> {
  await apiRequest<void>(`/funcionarios/${id}`, {
    method: 'DELETE',
  });
}
