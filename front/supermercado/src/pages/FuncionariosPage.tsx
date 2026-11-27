import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import FuncionarioForm, {
  formatarCPF,
  formatarTelefone,
} from '../components/FuncionarioForm';
import { useAuth } from '../hooks/useAuth';
import type { Cargo, Usuario } from '../domain/auth';
import {
  excluirFuncionario,
  listarFuncionarios,
} from '../services/FuncionarioService';
import { mensagemErro, normalizar } from '../utils';

type ModalAberto =
  | { tipo: 'form'; funcionario?: Usuario }
  | { tipo: 'excluir'; funcionario: Usuario }
  | null;

export default function FuncionariosPage() {
  const { usuario, atualizarUsuario } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCargo, setFiltroCargo] = useState<Cargo | 'todos'>('todos');
  const [erro, setErro] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [modal, setModal] = useState<ModalAberto>(null);

  const carregar = useCallback(async () => {
    try {
      setFuncionarios(await listarFuncionarios());
      setErro(null);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return funcionarios.filter((f) => {
      const casaCargo = filtroCargo === 'todos' || f.cargo === filtroCargo;
      if (!termo) return casaCargo;
      return (
        casaCargo &&
        (normalizar(f.nome).includes(termo) ||
          normalizar(f.email).includes(termo) ||
          f.cpf.includes(termo.replace(/\D/g, '') || termo))
      );
    });
  }, [funcionarios, busca, filtroCargo]);

  const fechar = () => {
    setErroExclusao(null);
    setModal(null);
  };

  const concluirForm = async (editadoId?: number) => {
    fechar();
    await carregar();
    if (editadoId && usuario && editadoId === usuario.id) {
      await atualizarUsuario();
    }
  };

  const confirmarExclusao = async (funcionario: Usuario) => {
    try {
      setExcluindo(true);
      setErroExclusao(null);
      await excluirFuncionario(funcionario.id);
      fechar();
      await carregar();
    } catch (e) {
      setErroExclusao(mensagemErro(e));
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <>
      <header>
        <h1>Funcionários</h1>
        <p>Cadastre e gerencie os funcionários e permissões de acesso ao sistema.</p>
      </header>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <section className="painel">
        <div className="barra">
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou CPF"
            aria-label="Buscar por nome, e-mail ou CPF"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            aria-label="Filtrar por cargo"
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value as Cargo | 'todos')}
          >
            <option value="todos">Todos os cargos</option>
            <option value="ADMIN">Administrador</option>
            <option value="FUNCIONARIO">Funcionário</option>
          </select>
          <button onClick={() => setModal({ tipo: 'form' })}>
            Cadastrar funcionário
          </button>
        </div>

        {visiveis.length === 0 ? (
          <p className="vazio">
            {funcionarios.length
              ? 'Nenhum funcionário encontrado com esses filtros.'
              : 'Nenhum funcionário cadastrado.'}
          </p>
        ) : (
          <div className="tabela-logs">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Cargo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((f) => {
                  const ehPropriaConta = f.id === usuario?.id;
                  return (
                    <tr key={f.id}>
                      <td>
                        {f.nome}
                        {ehPropriaConta && (
                          <span className="voce-tag">Você</span>
                        )}
                      </td>
                      <td>{f.email}</td>
                      <td>{formatarCPF(f.cpf)}</td>
                      <td>{f.telefone ? formatarTelefone(f.telefone) : '-'}</td>
                      <td>
                        <span
                          className={`badge-cargo ${
                            f.cargo === 'ADMIN' ? 'admin' : 'funcionario'
                          }`}
                        >
                          {f.cargo === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                        </span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            type="button"
                            className="sec"
                            onClick={() =>
                              setModal({ tipo: 'form', funcionario: f })
                            }
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="sec excluir"
                            disabled={ehPropriaConta}
                            title={
                              ehPropriaConta
                                ? 'Você não pode excluir sua própria conta.'
                                : undefined
                            }
                            onClick={() =>
                              setModal({ tipo: 'excluir', funcionario: f })
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal?.tipo === 'form' && (
        <Modal
          titulo={
            modal.funcionario ? 'Editar funcionário' : 'Cadastrar funcionário'
          }
          onFechar={fechar}
        >
          <FuncionarioForm
            inicial={modal.funcionario}
            onSalvo={concluirForm}
            onCancelar={fechar}
          />
        </Modal>
      )}

      {modal?.tipo === 'excluir' && (
        <Modal titulo="Excluir funcionário" onFechar={fechar}>
          <p>
            Deseja excluir <strong>{modal.funcionario.nome}</strong>? Essa ação
            não pode ser desfeita.
          </p>
          {erroExclusao && (
            <p className="erro" role="alert">
              {erroExclusao}
            </p>
          )}
          <div className="botoes">
            <button
              type="button"
              className="sec"
              onClick={fechar}
              disabled={excluindo}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="perigo"
              disabled={excluindo}
              onClick={() => void confirmarExclusao(modal.funcionario)}
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
