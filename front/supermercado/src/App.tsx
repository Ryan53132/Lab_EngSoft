import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProdutosPage from './pages/ProdutosPage';
import LogPage from './pages/LogPage';
import LoginPage from './pages/LoginPage';
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
  return (
    <div className="app">
      <Sidebar />
      <main>
        <Routes>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/logs" element={<LogPage />} />
          <Route path="*" element={<Navigate to="/produtos" replace />} />
        </Routes>
      </main>
    </div>
  );
}