import React from 'react';
import { NavLink } from 'react-router-dom'; // Используем NavLink для activeClassName
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">Обменник</NavLink>
      <ul className="navbar-nav">
        <li className="nav-item">
          <NavLink to="/operations" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Операции</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/clients" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Клиенты</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/currencies" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Валюты</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;