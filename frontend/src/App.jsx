import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Homepage';
import ClientsPage from './pages/ClientsPage';
import CurrenciesPage from './pages/CurrenciesPage';
import OperationsPage from './pages/OperationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './App.css';

const Home = () => (
  <div className="space-y-6">
    <div className="card">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Добро пожаловать в Exchange Point
      </h1>
      <p className="text-gray-600">
        Ваш надежный партнер в мире обмена валют
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Обмен валют</h2>
        <p className="text-gray-600 mb-4">Выгодные курсы обмена для популярных валют</p>
        <button className="btn btn-primary">Начать обмен</button>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Курсы валют</h2>
        <p className="text-gray-600 mb-4">Актуальные курсы валют в реальном времени</p>
        <button className="btn btn-secondary">Посмотреть курсы</button>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Поддержка</h2>
        <p className="text-gray-600 mb-4">Круглосуточная поддержка клиентов</p>
        <button className="btn btn-primary">Связаться с нами</button>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/currencies" element={<CurrenciesPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;