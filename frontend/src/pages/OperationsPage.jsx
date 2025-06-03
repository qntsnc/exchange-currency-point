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
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Загружаем лимиты из localStorage или используем значения по умолчанию
  const [operationLimits, setOperationLimits] = useState(() => {
    const saved = localStorage.getItem('operationLimits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          daily_currency_volume: parsed.find(l => l.limit_name === 'daily_currency_volume')?.limit_value || '1000.0',
          single_operation_amount: parsed.find(l => l.limit_name === 'single_operation_amount')?.limit_value || '5000.0',
        };
      } catch (e) {
        console.error('Error parsing operationLimits from localStorage:', e);
      }
    }
    return {
      daily_currency_volume: '1000.0',
      single_operation_amount: '5000.0',
    };
  });

  const fetchOperations = useCallback(async (page) => {
    setLoading(true);
    setError(null);
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
      console.error('Fetch operations error:', err);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const downloadReceipt = async (operationId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/operations/${operationId}/receipt`);
      if (!response.ok) {
        throw new Error(`Failed to download receipt (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${operationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError(prev => prev ? `${prev}; Ошибка скачивания чека: ${err.message}` : `Ошибка скачивания чека: ${err.message}`);
    }
  };

  const openReceipt = (reference) => {
    const receiptUrl = `http://localhost:8080/api/v1/receipts/${reference}`;
    window.open(receiptUrl, '_blank');
  };

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
      setError(prev => prev ? `${prev}; Ошибка загрузки данных для формы: ${err.message}` : `Ошибка загрузки данных для формы: ${err.message}`);
      console.error('Fetch dropdown data error:', err);
    }
  }, []); // Убраны зависимости, так как они не нужны

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
      setFormError('Все поля обязательны.');
      setFormLoading(false);
      return;
    }
    const amount = parseFloat(newOperation.amount);
    if (amount <= 0) {
      setFormError('Сумма должна быть больше нуля.');
      setFormLoading(false);
      return;
    }
    if (amount > parseFloat(operationLimits.single_operation_amount)) {
      setFormError(`Сумма операции превышает лимит ${operationLimits.single_operation_amount}`);
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        client_id: parseInt(newOperation.client_id),
        operation_type: newOperation.operation_type,
        currency_id: parseInt(newOperation.currency_id),
        amount: newOperation.amount.toString(), // Отправляем как строку
        daily_currency_volume: operationLimits.daily_currency_volume,
        single_operation_amount: operationLimits.single_operation_amount,
      };
      console.log('Sending operation payload:', payload);
      const response = await fetch('http://localhost:8080/api/v1/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = `Network response was not ok (${response.status})`;
        try {
          const errData = await response.json();
          message = errData.message || message;
        } catch (jsonErr) {
          console.error('Error parsing error response:', jsonErr);
        }
        if (message.includes('Daily limit')) {
          setFormError('Превышен дневной лимит по валюте. Попробуйте завтра или уменьшите сумму.');
        } else if (message.includes('Single operation')) {
          setFormError('Сумма операции превышает допустимый лимит.');
        } else {
          setFormError('Ошибка создания операции: ' + message);
        }
        throw new Error(message);
      }
      setNewOperation(prev => ({ ...prev, amount: '' }));
      fetchOperations(currentPage);
    } catch (err) {
      console.error('Error creating operation:', err);
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

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return 'Не указано';
    try {
      if (typeof dateTimeStr === 'object' && dateTimeStr !== null) {
        if (dateTimeStr.Time) {
          dateTimeStr = dateTimeStr.Time;
        } else if (dateTimeStr.Valid === false) {
          return 'Не указано';
        } else {
          dateTimeStr = String(dateTimeStr);
        }
      }
      if (typeof dateTimeStr === 'string') {
        const isoRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/;
        const match = dateTimeStr.match(isoRegex);
        if (match) {
          const date = new Date(dateTimeStr);
          return date.toLocaleString('ru-RU');
        }
        const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (dateMatch) {
          const cleanedDate = dateMatch[1].replace(' ', 'T');
          const date = new Date(cleanedDate);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString('ru-RU');
          }
        }
      }
      const date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('ru-RU');
      }
      return 'Некорректная дата';
    } catch (error) {
      console.error('Ошибка обработки даты:', error);
      return 'Ошибка даты';
    }
  };

  return (
    <div>
      <h2>Операции Обмена</h2>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

      <h3>Новая операция</h3>
      <form onSubmit={handleSubmit}>
        {formError && <p className="error-message" style={{ color: 'red' }}>{formError}</p>}
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="client_id">Клиент:</label>
          <select
            id="client_id"
            name="client_id"
            value={newOperation.client_id}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="">-- Выберите клиента --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.full_name} (ID: {client.id})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="operation_type">Тип операции:</label>
          <select
            id="operation_type"
            name="operation_type"
            value={newOperation.operation_type}
            onChange={handleInputChange}
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="CLIENT_SELLS_TO_EXCHANGE">Клиент продаёт валюту (покупает рубли)</option>
            <option value="CLIENT_BUYS_FROM_EXCHANGE">Клиент покупает валюту (продаёт рубли)</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="currency_id">Валюта:</label>
          <select
            id="currency_id"
            name="currency_id"
            value={newOperation.currency_id}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="">-- Выберите валюту --</option>
            {currencies.map(curr => (
              <option key={curr.id} value={curr.id}>
                {curr.code} ({curr.name})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="amount">
            {newOperation.operation_type === 'CLIENT_SELLS_TO_EXCHANGE'
              ? 'Сумма валюты (продажа):'
              : 'Сумма рублей (покупка):'}
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            name="amount"
            value={newOperation.amount}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '200px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <p>Лимит одной операции: {formatDecimal(operationLimits.single_operation_amount)}</p>
          <p>Дневной лимит по валюте: {formatDecimal(operationLimits.daily_currency_volume)}</p>
        </div>
        <button
          type="submit"
          disabled={formLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: formLoading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: formLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {formLoading ? 'Обработка...' : 'Создать операцию'}
        </button>
      </form>

      <h3>История операций</h3>
      {loading && <p className="loading-message">Загрузка операций...</p>}
      {!loading && operations.length === 0 && <p>Нет операций для отображения.</p>}
      {!loading && operations.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Клиент</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Тип</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Валюта</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Рубли</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Эфф. Курс</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Время</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Чек</th>
            </tr>
          </thead>
          <tbody>
            {operations.map(op => (
              <tr key={op.id} style={{ border: '1px solid #ddd' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{op.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{op.client_name || `ID: ${op.client_id}`}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? 'Продажа валюты' : 'Покупка валюты'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {formatDecimal(op.amount_currency)} {op.currency_code}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDecimal(op.amount_rub)} RUB</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatRate(op.effective_rate)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(op.operation_timestamp)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <a
                    className="receipt-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openReceipt(op.receipt_reference);
                    }}
                    title="Нажмите для просмотра чека"
                    style={{ color: '#2196F3', textDecoration: 'none' }}
                  >
                    {op.receipt_reference}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: currentPage === 1 || loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
          }}
        >
          Предыдущая
        </button>
        <span>Страница: {currentPage}</span>
        <button
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={operations.length < pageSize || loading}
          style={{
            padding: '8px 16px',
            marginLeft: '10px',
            backgroundColor: operations.length < pageSize || loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: operations.length < pageSize || loading ? 'not-allowed' : 'pointer',
          }}
        >
          Следующая
        </button>
      </div>
    </div>
  );
};

export default OperationsPage;