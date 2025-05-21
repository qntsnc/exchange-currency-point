import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // Проверьте этот путь тоже
import HomePage from './pages/HomePage';
import ClientsPage from './pages/ClientsPage'; // <--- ВОТ ЭТА СТРОКА ВАЖНА
import CurrenciesPage from './pages/CurrenciesPage';
import OperationsPage from './pages/OperationsPage';
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/currencies" element={<CurrenciesPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        {/* <Route path="*" element={<NotFoundPage />} /> // Если у вас есть страница 404 */}
      </Routes>
    </Layout>
  );
}

export default App;