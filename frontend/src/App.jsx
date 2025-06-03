import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; 
import HomePage from './pages/Homepage';
import ClientsPage from './pages/ClientsPage';
import CurrenciesPage from './pages/CurrenciesPage';
import OperationsPage from './pages/OperationsPage';
import AnalyticsPage from './pages/AnalyticsPage'; // Импортируем страницу аналитики
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/currencies" element={<CurrenciesPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} /> {/* Добавляем маршрут */}
      </Routes>
    </Layout>
  );
}

export default App;