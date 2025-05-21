import React from 'react';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content container">
        {children}
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Обменный Пункт. Пользователь: qntsnc. Время UTC: 2025-05-21 12:56:45</p>
      </footer>
    </>
  );
};

export default Layout;