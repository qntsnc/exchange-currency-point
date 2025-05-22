import React, { useState, useEffect, useCallback } from 'react';

const OperationsPage = () => {
  const [operations, setOperations] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [newOperation, setNewOperation] = useState({
    client_id: '',
    operation_type: 'CLIENT_SELLS_TO_EXCHANGE',
    currency_id: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchOperations = useCallback(async (page) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8080/api/v1/operations?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to fetch operations (${response.status})`);
      }
      const data = await response.json();
      setOperations(data.data || []);
    } catch (err) {
      setError('Ошибка загрузки операций: ' + err.message);
      console.error(err);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [clientsRes, currenciesRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/clients'),
        fetch('http://localhost:8080/api/v1/currencies')
      ]);

      if (!clientsRes.ok) throw new Error('Failed to fetch clients for dropdown');
      const clientsData = await clientsRes.json();
      setClients(clientsData.data || []);
      if (clientsData.data?.length > 0 && !newOperation.client_id) {
        setNewOperation(prev => ({ ...prev, client_id: clientsData.data[0].id.toString() }));
      }

      if (!currenciesRes.ok) throw new Error('Failed to fetch currencies for dropdown');
      const currenciesData = await currenciesRes.json();
      setCurrencies(currenciesData.data || []);
      if (currenciesData.data?.length > 0 && !newOperation.currency_id) {
        setNewOperation(prev => ({ ...prev, currency_id: currenciesData.data[0].id.toString() }));
      }
    } catch (err) {
      setError(prev => prev + '; Ошибка загрузки данных для формы: ' + err.message);
      console.error(err);
    }
  }, [newOperation.client_id, newOperation.currency_id]);

  useEffect(() => {
    fetchOperations(currentPage);
  }, [currentPage, fetchOperations]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOperation(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!newOperation.client_id || !newOperation.currency_id || !newOperation.amount) {
      setFormError("Все поля обязательны.");
      setFormLoading(false);
      return;
    }
    if (parseFloat(newOperation.amount) <= 0) {
      setFormError("Сумма должна быть больше нуля.");
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        client_id: parseInt(newOperation.client_id),
        operation_type: newOperation.operation_type,
        currency_id: parseInt(newOperation.currency_id),
        amount: newOperation.amount,
      };
      const response = await fetch('http://localhost:8080/api/v1/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Network response was not ok (${response.status})`);
      }
      setNewOperation(prev => ({ ...prev, amount: '' }));
      fetchOperations(currentPage);
    } catch (err) {
      setFormError('Ошибка создания операции: ' + err.message);
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const formatDecimal = (decimalStr) => {
    if (!decimalStr) return 'N/A';
    const num = parseFloat(decimalStr);
    return isNaN(num) ? decimalStr : num.toFixed(2);
  };
  
  const formatRate = (rateStr) => {
    if (!rateStr) return 'N/A';
    const num = parseFloat(rateStr);
    return isNaN(num) ? rateStr : num.toFixed(4);
  };

  // Улучшенная функция форматирования даты
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
      <h2>Операции Обмена</h2>
      {error && <p className="error-message">{error}</p>}

      <h3>Новая операция</h3>
      <form onSubmit={handleSubmit}>
        {formError && <p className="error-message">{formError}</p>}
        <div>
          <label htmlFor="client_id">Клиент:</label>
          <select id="client_id" name="client_id" value={newOperation.client_id} onChange={handleInputChange} required>
            <option value="">-- Выберите клиента --</option>
            {clients.map(client => <option key={client.id} value={client.id}>{client.full_name} (ID: {client.id})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="operation_type">Тип операции:</label>
          <select id="operation_type" name="operation_type" value={newOperation.operation_type} onChange={handleInputChange}>
            <option value="CLIENT_SELLS_TO_EXCHANGE">Клиент продаёт валюту (покупает рубли)</option>
            <option value="CLIENT_BUYS_FROM_EXCHANGE">Клиент покупает валюту (продаёт рубли)</option>
          </select>
        </div>
        <div>
          <label htmlFor="currency_id">Валюта:</label>
          <select id="currency_id" name="currency_id" value={newOperation.currency_id} onChange={handleInputChange} required>
            <option value="">-- Выберите валюту --</option>
            {currencies.map(curr => <option key={curr.id} value={curr.id}>{curr.code} ({curr.name})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="amount">
            {newOperation.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? 'Сумма валюты (продажа):' : 'Сумма рублей (покупка):'}
          </label>
          <input id="amount" type="number" step="0.01" name="amount" value={newOperation.amount} onChange={handleInputChange} required />
        </div>
        <button type="submit" disabled={formLoading}>{formLoading ? 'Обработка...' : 'Создать операцию'}</button>
      </form>

      <h3>История операций</h3>
      {loading && <p className="loading-message">Загрузка операций...</p>}
      {!loading && operations.length === 0 && <p>Нет операций для отображения.</p>}
      {!loading && operations.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Клиент</th>
              <th>Тип</th>
              <th>Валюта</th>
              <th>Рубли</th>
              <th>Эфф. Курс</th>
              <th>Время</th>
              <th>Чек</th>
            </tr>
          </thead>
          <tbody>
            {operations.map(op => (
              <tr key={op.id}>
                <td>{op.id}</td>
                <td>{op.client_name || `ID: ${op.client_id}`}</td>
                <td>{op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? 'Продажа валюты' : 'Покупка валюты'}</td>
                <td>{formatDecimal(op.amount_currency)} {op.currency_code}</td>
                <td>{formatDecimal(op.amount_rub)} RUB</td>
                <td>{formatRate(op.effective_rate)}</td>
                <td>{formatDate(op.operation_timestamp)}</td>
                <td>{op.receipt_reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>Предыдущая</button>
        <span> Страница: {currentPage} </span>
        <button onClick={() => setCurrentPage(p => p + 1)} disabled={operations.length < pageSize || loading}>Следующая</button>
      </div>
    </div>
  );
};

export default OperationsPage;