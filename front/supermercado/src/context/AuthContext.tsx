import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  AUTH_UNAUTHORIZED_EVENT,
  TOKEN_KEY,
  buscarUsuarioAtual,
  fazerLogin,
  type Usuario,
} from '../services/AuthService';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
  atualizarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const atualizarUsuario = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUsuario(null);
      return;
    }

    try {
      const usuarioAtual = await buscarUsuarioAtual(token);
      setUsuario(usuarioAtual);
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    async function restaurarSessao() {
      await atualizarUsuario();
      setCarregando(false);
    }

    void restaurarSessao();
  }, [atualizarUsuario]);

  useEffect(() => {
    const aoDesautorizar = () => {
      setUsuario(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, aoDesautorizar);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, aoDesautorizar);
    };
  }, []);

  const entrar = async (email: string, senha: string) => {
    const resposta = await fazerLogin({ email, senha });

    sessionStorage.setItem(TOKEN_KEY, resposta.access_token);
    setUsuario(resposta.user);
  };

  const sair = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, sair, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }

  return contexto;
}
