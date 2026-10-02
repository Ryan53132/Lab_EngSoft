import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProdutosPage from './pages/ProdutosPage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main>
        <Routes>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="*" element={<Navigate to="/produtos" replace />} />
        </Routes>
      </main>
    </div>
  );
}