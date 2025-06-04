import React from 'react';

const Homepage = () => {
  return (
    <div className="homepage">
      <div className="hero">
        <h1 className="main-title">💱 Система обмена валют</h1>
        <p className="subtitle">
          Эта система предназначена для учета операций по обмену валюты и управления данными.
        </p>
      </div>
      <div className="features">
        <div className="feature-card">
          <h3>💸 Операции</h3>
          <p>Просмотр и создание операций обмена валюты.</p>
          <a href="/operations" className="feature-link">
            Перейти &rarr;
          </a>
        </div>
        <div className="feature-card">
          <h3>👥 Клиенты</h3>
          <p>Управление информацией о клиентах системы.</p>
          <a href="/clients" className="feature-link">
            Перейти &rarr;
          </a>
        </div>
        <div className="feature-card">
          <h3>💰 Валюты</h3>
          <p>Просмотр текущих курсов и управление валютами.</p>
          <a href="/currencies" className="feature-link">
            Перейти &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export default Homepage;