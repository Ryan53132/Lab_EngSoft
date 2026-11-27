import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import ProdutosPage from './pages/ProdutosPage';
import LogPage from './pages/LogPage';
import LoginPage from './pages/LoginPage';
import CadastrosPage from './pages/CadastrosPage';
import FuncionariosPage from './pages/FuncionariosPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ehAdmin } from './domain/auth';

import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function RotaProtegida() {
  const { usuario } = useAuth();
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}

function RotaAdmin() {
  const { usuario } = useAuth();
  return ehAdmin(usuario) ? <Outlet /> : <Navigate to="/produtos" replace />;
}

function LayoutAutenticado() {
  const { sair } = useAuth();

  return (
    <div className="app">
      <Sidebar onSair={sair} />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <main className="login">
        <p className="vazio">Verificando autenticação...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          usuario ? <Navigate to="/produtos" replace /> : <LoginPage />
        }
      />

      <Route element={<RotaProtegida />}>
        <Route element={<LayoutAutenticado />}>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/cadastros" element={<CadastrosPage />} />

          <Route element={<RotaAdmin />}>
            <Route path="/funcionarios" element={<FuncionariosPage />} />
            <Route path="/logs" element={<LogPage />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={usuario ? '/produtos' : '/login'} replace />
        }
      />
    </Routes>
  );
}
