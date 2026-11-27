import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ehAdmin } from '../domain/auth';
import { useAuth } from '../hooks/useAuth';

interface ItemMenu {
  to: string;
  label: string;
  apenasAdmin?: boolean;
  icone: ReactNode;
}

const itens: ItemMenu[] = [
  {
    to: '/cadastros',
    label: 'Cadastros',
    icone: <span aria-hidden="true">+</span>,
  },
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
  {
    to: '/funcionarios',
    label: 'Funcionários',
    apenasAdmin: true,
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/logs',
    label: 'Logs',
    apenasAdmin: true,
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </svg>
    ),
  },
];

export default function Sidebar({ onSair }: { onSair: () => void }) {
  const { usuario } = useAuth();
  const admin = ehAdmin(usuario);

  const itensVisiveis = itens.filter((item) => !item.apenasAdmin || admin);

  return (
    <aside className="sidebar">
      <div className="marca">Supermercado</div>

      {usuario && (
        <div className="sidebar-usuario">
          <strong>{usuario.nome}</strong>
          <span className="cargo-tag">
            {admin ? 'Administrador' : 'Funcionário'}
          </span>
        </div>
      )}

      <nav>
        {itensVisiveis.map(({ to, label, icone }) => (
          <NavLink key={to} to={to}>
            {icone}
            {label}
          </NavLink>
        ))}
      </nav>

      <button className="sair" onClick={onSair}>
        Sair
      </button>
    </aside>
  );
}
