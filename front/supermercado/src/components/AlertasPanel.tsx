import { useAlertas } from '../hooks/useLoja';

export default function AlertasPanel() {
  const alertas = useAlertas();

  return (
    <section className="painel">
      <h2>Alertas <span className="contador">{alertas.length}</span></h2>
      {alertas.length === 0 && <p className="vazio">Nenhum alerta ativo. O estoque está em dia.</p>}
      <ul className="alertas">
        {alertas.map((a) => (
          <li key={a.key} className={a.tipo === 'QUEIMA' ? 'queima' : 'reposicao'}>
            {a.mensagem}
          </li>
        ))}
      </ul>
    </section>
  );
}
