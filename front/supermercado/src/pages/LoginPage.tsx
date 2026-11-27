import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (event: FormEvent) => {
    event.preventDefault();

    setErro(null);

    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha para continuar.');
      return;
    }

    try {
      setCarregando(true);

      await entrar(email.trim(), senha);

      navigate('/produtos', { replace: true });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao realizar login.',
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="login">
      <div className="login-shell">
        <aside className="login-destaque" aria-hidden="true">
          <div className="login-marca">
            <span className="login-logo">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <span>Supermercado</span>
          </div>

          <div className="login-destaque-corpo">
            <span className="login-etiqueta">Gestão de Estoque</span>
            <h2>Controle completo do seu mercado em um só lugar.</h2>
            <p>
              Acompanhe lotes, validades, alertas de reposição e movimentações
              com segurança por perfil de acesso.
            </p>
          </div>

          <ul className="login-beneficios">
            <li>
              <span className="login-ponto" />
              Alertas automáticos de estoque baixo e vencimento
            </li>
            <li>
              <span className="login-ponto" />
              Cadastro integrado de produtos, lotes e fornecedores
            </li>
            <li>
              <span className="login-ponto" />
              Auditoria e controle de permissões por cargo
            </li>
          </ul>
        </aside>

        <section className="login-card">
          <div className="login-card-topo">
            <span className="marca-login">Supermercado</span>
            <h1>Bem-vindo de volta</h1>
            <p>Informe suas credenciais para acessar o painel da loja.</p>
          </div>

          <form className="form login-form" onSubmit={fazerLogin}>
            <label>
              E-mail
              <div className="input-icone">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="email"
                  placeholder="nome@mercado.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoFocus
                  autoComplete="email"
                  disabled={carregando}
                />
              </div>
            </label>

            <label>
              Senha
              <div className="input-icone">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="current-password"
                  disabled={carregando}
                />
                <button
                  type="button"
                  className="toggle-senha"
                  onClick={() => setMostrarSenha((atual) => !atual)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={carregando}
                >
                  {mostrarSenha ? (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                      <path d="m2 2 20 20" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {erro && (
              <div className="login-erro" role="alert">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>

          <p className="login-rodape">
            Acesso exclusivo para funcionários e administradores cadastrados.
          </p>
        </section>
      </div>
    </main>
  );
}
