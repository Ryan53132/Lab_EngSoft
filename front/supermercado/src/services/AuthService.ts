import { API_URL } from '../config';
import type {
  LoginCredentials,
  LoginResponse,
  Usuario,
} from '../domain/auth';

export type {
  Cargo,
  LoginCredentials,
  LoginResponse,
  Usuario,
} from '../domain/auth';

export const TOKEN_KEY = 'supermercado:token';
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export async function extrairMensagemErro(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => null);
  const detail = body?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const mensagens = detail
      .map((item: { msg?: string }) => item?.msg)
      .filter((msg): msg is string => Boolean(msg));
    if (mensagens.length > 0) {
      return mensagens.join(' ');
    }
  }

  return fallback;
}

export async function fazerLogin(
  credenciais: LoginCredentials,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credenciais),
  });

  if (!response.ok) {
    throw new Error(
      await extrairMensagemErro(response, 'Não foi possível realizar o login.'),
    );
  }

  return response.json();
}

export async function buscarUsuarioAtual(token: string): Promise<Usuario> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Sessão inválida ou expirada.');
  }

  return response.json();
}

export async function requisicaoAutenticada(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    throw new Error('Usuário não autenticado.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return response;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await requisicaoAutenticada(endpoint, options);

  if (!response.ok) {
    throw new Error(
      await extrairMensagemErro(
        response,
        `Erro ${response.status} ao acessar ${endpoint}`,
      ),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
