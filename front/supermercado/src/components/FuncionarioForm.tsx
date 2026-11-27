import { useState, type FormEvent } from 'react';
import type { Cargo, Usuario } from '../domain/auth';
import {
  atualizarFuncionario,
  criarFuncionario,
} from '../services/FuncionarioService';
import { mensagemErro } from '../utils';

interface FuncionarioFormProps {
  inicial?: Usuario;
  onSalvo: (editadoId?: number) => void | Promise<void>;
  onCancelar: () => void;
}

const somenteDigitos = (valor: string) => valor.replace(/\D/g, '');

export const formatarCPF = (valor: string): string => {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
};

export const formatarTelefone = (valor: string | null | undefined): string => {
  if (!valor) return '';
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

export default function FuncionarioForm({
  inicial,
  onSalvo,
  onCancelar,
}: FuncionarioFormProps) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [email, setEmail] = useState(inicial?.email ?? '');
  const [cpf, setCpf] = useState(inicial ? formatarCPF(inicial.cpf) : '');
  const [telefone, setTelefone] = useState(
    inicial?.telefone ? formatarTelefone(inicial.telefone) : '',
  );
  const [cargo, setCargo] = useState<Cargo>(inicial?.cargo ?? 'FUNCIONARIO');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const cpfDigitos = somenteDigitos(cpf);
    const telefoneDigitos = somenteDigitos(telefone);

    if (!nomeLimpo) {
      setErro('Informe o nome do funcionário.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLimpo)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (cpfDigitos.length !== 11) {
      setErro('O CPF deve possuir 11 números.');
      return;
    }
    if (telefoneDigitos && telefoneDigitos.length !== 10 && telefoneDigitos.length !== 11) {
      setErro('O telefone deve possuir DDD e 10 ou 11 números.');
      return;
    }
    if (!inicial && senha.length < 8) {
      setErro('A senha deve possuir pelo menos 8 caracteres.');
      return;
    }
    if (inicial && senha && senha.length < 8) {
      setErro('A nova senha deve possuir pelo menos 8 caracteres.');
      return;
    }

    try {
      setSalvando(true);
      if (inicial) {
        await atualizarFuncionario(inicial.id, {
          nome: nomeLimpo,
          email: emailLimpo,
          cpf: cpfDigitos,
          telefone: telefoneDigitos || null,
          cargo,
          ...(senha ? { senha } : {}),
        });
        await onSalvo(inicial.id);
      } else {
        await criarFuncionario({
          nome: nomeLimpo,
          email: emailLimpo,
          cpf: cpfDigitos,
          telefone: telefoneDigitos || null,
          cargo,
          senha,
        });
        await onSalvo();
      }
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="form" onSubmit={salvar}>
      <label>
        Nome
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={salvando}
          autoFocus
        />
      </label>

      <label>
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={salvando}
        />
      </label>

      <div className="linha">
        <label>
          CPF
          <input
            value={cpf}
            placeholder="000.000.000-00"
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            disabled={salvando}
          />
        </label>

        <label>
          Telefone
          <input
            value={telefone}
            placeholder="(00) 00000-0000"
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            disabled={salvando}
          />
        </label>
      </div>

      <div className="linha">
        <label>
          Cargo
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value as Cargo)}
            disabled={salvando}
          >
            <option value="FUNCIONARIO">Funcionário</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>

        <label>
          {inicial ? 'Nova senha (opcional)' : 'Senha'}
          <input
            type="password"
            value={senha}
            placeholder={
              inicial ? 'Manter senha atual' : 'Mínimo 8 caracteres'
            }
            onChange={(e) => setSenha(e.target.value)}
            disabled={salvando}
          />
        </label>
      </div>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <div className="botoes">
        <button
          type="button"
          className="sec"
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando}>
          {salvando
            ? 'Salvando...'
            : inicial
              ? 'Salvar alterações'
              : 'Cadastrar funcionário'}
        </button>
      </div>
    </form>
  );
}
