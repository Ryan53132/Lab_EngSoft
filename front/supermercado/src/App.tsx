import { Navigate, Route, Routes } from 'react-router-dom';
import ProdutosPage from './pages/Produtospage';
import './App.css';

export default function App() {
  return (
    <main>
      <header>
        <h1>Supermercado</h1>
        <p>Estoque, validade e preço de venda em um só lugar.</p>
      </header>
      <Routes>
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="*" element={<Navigate to="/produtos" replace />} />
      </Routes>
    </main>
  );
}