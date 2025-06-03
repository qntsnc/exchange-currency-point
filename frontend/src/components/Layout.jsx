import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <main className="main-content container" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        {children}
      </main>
      <footer className="footer">
        <p>
          &copy; {currentTime.getFullYear()} Обменный Пункт. Пользователь: qntsnc. Время UTC:{' '}
          {currentTime.toISOString().replace('T', ' ').slice(0, 19)}
        </p>
      </footer>
    </>
  );
};

export default Layout;