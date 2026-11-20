import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProdutosPage from './pages/ProdutosPage';
import LogPage from './pages/LogPage';
import CadastrosPage from './pages/CadastrosPage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
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