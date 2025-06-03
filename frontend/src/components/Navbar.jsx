import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <NavLink to="/">Обменный пункт</NavLink>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/" exact activeClassName="active">
            Главная
          </NavLink>
        </li>
        <li>
          <NavLink to="/clients" activeClassName="active">
            Клиенты
          </NavLink>
        </li>
        <li>
          <NavLink to="/currencies" activeClassName="active">
            Валюты
          </NavLink>
        </li>
        <li>
          <NavLink to="/operations" activeClassName="active">
            Операции
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics" activeClassName="active">
            Аналитика
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;