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
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
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

function iniciaisUsuario(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({ onSair }: { onSair: () => void }) {
  const { usuario } = useAuth();
  const admin = ehAdmin(usuario);

  const itensVisiveis = itens.filter((item) => !item.apenasAdmin || admin);

  return (
    <aside className="sidebar">
      <div className="sidebar-topo">
        <div className="marca">
          <span className="marca-icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <div>
            <strong>Supermercado</strong>
            <small>Gestão de Estoque</small>
          </div>
        </div>

        {usuario && (
          <div className="sidebar-usuario">
            <span className="sidebar-avatar" aria-hidden="true">
              {iniciaisUsuario(usuario.nome)}
            </span>
            <div className="sidebar-usuario-dados">
              <strong>{usuario.nome}</strong>
              <span className={`cargo-tag${admin ? ' admin' : ''}`}>
                {admin ? 'Administrador' : 'Funcionário'}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav aria-label="Navegação principal">
        {itensVisiveis.map(({ to, label, icone }) => (
          <NavLink key={to} to={to}>
            {icone}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-rodape">
        <button className="sair" onClick={onSair}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
