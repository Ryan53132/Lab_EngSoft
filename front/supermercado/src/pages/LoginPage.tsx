import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const entrar = (event: FormEvent) => {
    event.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro('Informe usuário e senha para continuar.');
      return;
    }
    sessionStorage.setItem('supermercado:usuario', usuario.trim());
    navigate('/produtos', { replace: true });
  };

  return (
    <main className="login">
      <section className="login-card">
        <div className="marca-login">Supermercado</div>
        <h1>Bem-vindo de volta</h1>
        <p>Entre para gerenciar o estoque da loja.</p>
        <form className="form" onSubmit={entrar}>
          <label>Usuário<input value={usuario} onChange={(event) => setUsuario(event.target.value)} autoFocus /></label>
          <label>Senha<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
