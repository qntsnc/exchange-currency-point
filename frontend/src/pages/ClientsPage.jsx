import React, { useState, useEffect, useCallback } from 'react';
import './ClientsPage.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({ passport_number: '', full_name: '', phone_number: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/v1/clients');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setClients(data.data || []);
    } catch (err) {
      setError('Ошибка загрузки клиентов: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newClient.passport_number.trim() || !newClient.full_name.trim()) {
        setFormError('Номер паспорта и ФИО обязательны для заполнения.');
        return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Network response was not ok (${response.status})`);
      }
      setNewClient({ passport_number: '', full_name: '', phone_number: '' });
      fetchClients();
    } catch (err) {
      setFormError('Ошибка создания клиента: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (clientId) => {
    // Функция просмотра клиента
    console.log('Просмотр клиента:', clientId);
    // Здесь можно добавить логику для открытия модального окна или перехода на страницу клиента
  };

  const handleEditClient = (clientId) => {
    // Функция редактирования клиента
    console.log('Редактирование клиента:', clientId);
    // Здесь можно добавить логику для редактирования клиента
  };

  const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return 'Не указано';
  
  try {
    // Если dateTimeStr это объект с полем Time, извлекаем значение Time
    if (typeof dateTimeStr === 'object' && dateTimeStr !== null) {
      if (dateTimeStr.Time) {
        dateTimeStr = dateTimeStr.Time;
      } else {
        // Если нет поля Time, но есть Valid, возможно это NullTime из Go
        if (dateTimeStr.Valid === false) {
          return 'Не указано';
        }
        // Попробуем преобразовать объект в строку
        dateTimeStr = String(dateTimeStr);
      }
    }
    
    // Если dateTimeStr это строка
    if (typeof dateTimeStr === 'string') {
      // Обработка формата ISO 8601 с Z в конце и микросекундами
      const isoRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/;
      const match = dateTimeStr.match(isoRegex);
      
      if (match) {
        // Уже валидный ISO формат, можем использовать напрямую
        const date = new Date(dateTimeStr);
        return date.toLocaleString('ru-RU');
      }
      
      // Проверяем формат "YYYY-MM-DD HH:MM:SS"
      const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        const cleanedDate = dateMatch[1].replace(' ', 'T');
        const date = new Date(cleanedDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('ru-RU');
        }
      }
    }
    
    // Если все специальные проверки не сработали, пробуем просто создать Date
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('ru-RU');
    }
    
    // Если ничего не сработало
    return 'Некорректная дата';
  } catch (error) {
    console.error('Ошибка обработки даты:', error);
    return 'Ошибка даты';
  }
};

  return (
    <div className="main-content">
      <div className="container">
        <h1 className="page-title">👥 Управление клиентами</h1>

        {/* Общие ошибки */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Форма добавления клиента */}
        <div className="client-form-section">
          <h2 className="section-title">➕ Добавить нового клиента</h2>
          
          <form onSubmit={handleSubmit} className="client-form">
            {formError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {formError}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="passport_number">📄 Номер паспорта</label>
                <input 
                  id="passport_number" 
                  type="text" 
                  name="passport_number" 
                  value={newClient.passport_number} 
                  onChange={handleInputChange}
                  placeholder="1234 567890"
                  required 
                  className="form-input"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="full_name">👤 ФИО</label>
                <input 
                  id="full_name" 
                  type="text" 
                  name="full_name" 
                  value={newClient.full_name} 
                  onChange={handleInputChange}
                  placeholder="Иванов Иван Иванович"
                  required 
                  className="form-input"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="phone_number">📱 Номер телефона</label>
                <input 
                  id="phone_number" 
                  type="text" 
                  name="phone_number" 
                  value={newClient.phone_number} 
                  onChange={handleInputChange}
                  placeholder="+7 (999) 123-45-67"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loader"></div>
                    Добавление...
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    Добавить клиента
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Список клиентов */}
        <div className="clients-list-section">
          <h2 className="section-title">📋 Список клиентов</h2>
          
          {loading && (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Загрузка списка клиентов...</p>
            </div>
          )}

          {!loading && clients.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Нет клиентов</h3>
              <p>Начните с добавления первого клиента в систему</p>
            </div>
          )}

          {!loading && clients.length > 0 && (
            <div className="clients-table-container">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>🔢 ID</th>
                    <th>👤 Клиент</th>
                    <th>📄 Паспорт</th>
                    <th>📱 Телефон</th>
                    <th>📅 Дата регистрации</th>
                    <th>⚙️ Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} className="client-row">
                      <td className="id-cell">
                        <span className="client-id-badge">
                          {client.id}
                        </span>
                      </td>
                      <td className="client-info">
                        <div className="client-name">{client.full_name}</div>
                      </td>
                      <td className="passport-cell">
                        <span className="passport-number">
                          {client.passport_number || 'Не указан'}
                        </span>
                      </td>
                      <td className="phone-cell">
                        <span className="phone-number">
                          {client.phone_number?.String || client.phone_number || 'Не указан'}
                        </span>
                      </td>
                      <td className="date-cell">
                        <span className="registration-date">
                          {formatDate(client.created_at)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleViewClient(client.id)}
                            className="btn-view"
                            title="Просмотр профиля"
                          >
                            <span>👁️</span>
                            Просмотр
                          </button>
                          <button 
                            onClick={() => handleEditClient(client.id)}
                            className="btn-edit"
                            title="Редактировать"
                          >
                            <span>✏️</span>
                            Редактировать
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;