import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProdutosPage from './pages/ProdutosPage';
import LogPage from './pages/LogPage';
import LoginPage from './pages/LoginPage';
import CadastrosPage from './pages/CadastrosPage';
import './App.css';

export default function App() {
  const autenticado = Boolean(sessionStorage.getItem('supermercado:usuario'));

  return (
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/produtos" replace /> : <LoginPage />}
      />
      <Route
        path="*"
        element={autenticado ? <LayoutAutenticado /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

function LayoutAutenticado() {
  const navigate = useNavigate();
  const sair = () => {
    sessionStorage.removeItem('supermercado:usuario');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <Sidebar onSair={sair} />
      <main>
        <Routes>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/logs" element={<LogPage />} />
          <Route path="/cadastros" element={<CadastrosPage />} />
          <Route path="*" element={<Navigate to="/produtos" replace />} />
        </Routes>
      </main>
    </div>
  );
}