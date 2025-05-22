import React, { useState, useEffect, useCallback } from 'react';

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
    <div>
      <h2>Клиенты</h2>
      {error && <p className="error-message">{error}</p>}
      
      <h3>Добавить нового клиента</h3>
      <form onSubmit={handleSubmit}>
        {formError && <p className="error-message">{formError}</p>}
        <div>
          <label htmlFor="passport_number">Номер паспорта:</label>
          <input id="passport_number" type="text" name="passport_number" value={newClient.passport_number} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="full_name">ФИО:</label>
          <input id="full_name" type="text" name="full_name" value={newClient.full_name} onChange={handleInputChange} required />
        </div>
        <div>
          <label htmlFor="phone_number">Номер телефона:</label>
          <input id="phone_number" type="text" name="phone_number" value={newClient.phone_number} onChange={handleInputChange} />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Добавление...' : 'Добавить клиента'}</button>
      </form>

      <h3>Список клиентов</h3>
      {loading && <p className="loading-message">Загрузка списка клиентов...</p>}
      {!loading && clients.length === 0 && <p>Нет клиентов для отображения.</p>}
      {!loading && clients.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Номер паспорта</th>
              <th>Телефон</th>
              <th>Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.full_name}</td>
                <td>{client.passport_number}</td>
                <td>{client.phone_number?.String || 'N/A'}</td>
                <td>{formatDate(client.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ClientsPage;