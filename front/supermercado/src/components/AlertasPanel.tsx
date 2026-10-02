import { useAlertas } from '../hooks/useLoja';

export default function AlertasPanel() {
  const alertas = useAlertas();

  return (
    <details className="painel alertas-menu">
      <summary>
        Alertas <span className={`contador${alertas.length ? ' ativo' : ''}`}>{alertas.length}</span>
      </summary>
      {alertas.length === 0 ? (
        <p className="vazio">Nenhum alerta ativo. O estoque está em dia.</p>
      ) : (
        <ul className="alertas">
          {alertas.map((a) => (
            <li key={a.key} className={a.tipo === 'QUEIMA' ? 'queima' : 'reposicao'}>
              {a.mensagem}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}