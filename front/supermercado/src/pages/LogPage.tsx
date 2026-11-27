import { useEffect, useState } from 'react';
import { USE_MOCK } from '../config';
import { apiRequest } from '../services/AuthService';

interface Log {
  movimentacao_id: number;
  produto_id: number;
  produto_nome: string | null;
  tipo: string | null;
  quantidade_anterior: number | null;
  quantidade_nova: number | null;
  usuario: string | null;
  acao: string | null;
  data_acao: string;
}

export default function LogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (USE_MOCK) return;

    const carregar = async () => {
      try {
        setLogs(await apiRequest<Log[]>('/logs'));
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar os logs');
      }
    };

    void carregar();
  }, []);

  return (
    <>
      <header>
        <h1>Logs</h1>
        <p>Consulte o historico de movimentacoes do sistema.</p>
      </header>

      {erro && <p className="erro" role="alert">{erro}</p>}
      <section className="painel">
        {logs.length === 0 && !erro ? (
          <p className="vazio">Nenhum log disponivel no momento.</p>
        ) : (
          <div className="tabela-logs">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Ação</th>
                  <th>Anterior</th>
                  <th>Nova</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={`${log.movimentacao_id}-${log.produto_id}`}>
                    <td>{new Date(log.data_acao).toLocaleString('pt-BR')}</td>
                    <td>{log.produto_nome ?? `Produto ${log.produto_id}`}</td>
                    <td>{log.tipo ?? '-'}</td>
                    <td>{log.acao ?? '-'}</td>
                    <td>{log.quantidade_anterior ?? '-'}</td>
                    <td>{log.quantidade_nova ?? '-'}</td>
                    <td>{log.usuario ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}