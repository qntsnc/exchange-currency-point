import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">Exchange Point</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Главная
              </Link>
              <Link to="/exchange" className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Обмен
              </Link>
              <Link to="/rates" className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Курсы
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button className="btn btn-primary">
              Войти
            </button>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Открыть меню</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50">
              Главная
            </Link>
            <Link to="/exchange" className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50">
              Обмен
            </Link>
            <Link to="/rates" className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50">
              Курсы
            </Link>
            <div className="px-3 py-2">
              <button className="w-full btn btn-primary">
                Войти
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;