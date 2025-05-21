import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Предполагается, что App.jsx находится в той же директории
// import reportWebVitals from './reportWebVitals'; // <--- ЗАКОММЕНТИРОВАНО
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Если вы хотите измерять производительность в вашем приложении, передайте функцию
// для логирования результатов (например: reportWebVitals(console.log))
// или отправьте на эндпоинт аналитики. Узнайте больше: https://bit.ly/CRA-vitals
// reportWebVitals(); // <--- ЗАКОММЕНТИРОВАНО