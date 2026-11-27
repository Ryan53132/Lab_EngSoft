
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
          : 'Erro ao realizar login.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="login">
      <section className="login-card">
        <div className="marca-login">Supermercado</div>

        <h1>Bem-vindo de volta</h1>

        <p>Entre para gerenciar o estoque da loja.</p>

        <form className="form" onSubmit={fazerLogin}>
          <label>
            E-mail

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
              disabled={carregando}
            />
          </label>

          <label>
            Senha

            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={carregando}
            />
          </label>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
