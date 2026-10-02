import { NavLink } from 'react-router-dom';

const itens = [
  {
    to: '/produtos',
    label: 'Produtos',
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="marca">Supermercado</div>
      <nav>
        {itens.map(({ to, label, icone }) => (
          <NavLink key={to} to={to}>
            {icone}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}