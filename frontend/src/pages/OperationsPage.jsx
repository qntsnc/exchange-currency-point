import React, { useState, useEffect, useCallback } from 'react';
import './OperationsPage.css';

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
          daily_currency_volume: parsed.find(l => l.limit_name === 'daily_currency_volume')?.limit_value || '5000.0',
          single_operation_amount: parsed.find(l => l.limit_name === 'single_operation_amount')?.limit_value || '1000.0',
        };
      } catch (e) {
        console.error('Error parsing operationLimits from localStorage:', e);
      }
    }
    return {
      daily_currency_volume: '5000.0',
      single_operation_amount: '1000.0',
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

  const handleViewOperation = (operationId) => {
    // Функция просмотра операции
    console.log('Просмотр операции:', operationId);
    // Здесь можно добавить логику для открытия модального окна с деталями операции
  };

  const handleCancelOperation = async (operationId) => {
    // Функция отмены операции
    try {
      console.log('Отмена операции:', operationId);
      const response = await fetch(`http://localhost:8080/api/v1/operations/${operationId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to cancel operation (${response.status})`);
      }
      // Обновляем список операций после отмены
      fetchOperations(currentPage);
    } catch (err) {
      setError('Ошибка отмены операции: ' + err.message);
      console.error('Cancel operation error:', err);
    }
  };

  const sellOperations = operations.filter(op => op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE');
  const buyOperations = operations.filter(op => op.operation_type === 'CLIENT_BUYS_FROM_EXCHANGE');
  const totalVolume = operations.reduce((sum, op) => sum + parseFloat(op.amount_rub || 0), 0);

  return (
    <div className="main-content">
      <div className="container">
        <h1 className="page-title">💸 Операции обмена</h1>

        {/* Общие ошибки */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Форма создания операции */}
        <div className="operation-form-section">
          <h2 className="section-title">➕ Новая операция</h2>
          
          <form onSubmit={handleSubmit} className="operation-form">
            {formError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {formError}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="client_id">👤 Клиент</label>
                <select
                  id="client_id"
                  name="client_id"
                  value={newOperation.client_id}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">-- Выберите клиента --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} (ID: {client.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="operation_type">🔄 Тип операции</label>
                <select
                  id="operation_type"
                  name="operation_type"
                  value={newOperation.operation_type}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="CLIENT_SELLS_TO_EXCHANGE">Клиент продаёт валюту (покупает рубли)</option>
                  <option value="CLIENT_BUYS_FROM_EXCHANGE">Клиент покупает валюту (продаёт рубли)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="currency_id">💱 Валюта</label>
                <select
                  id="currency_id"
                  name="currency_id"
                  value={newOperation.currency_id}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">-- Выберите валюту --</option>
                  {currencies.map(curr => (
                    <option key={curr.id} value={curr.id}>
                      {curr.code} ({curr.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="amount">
                  💰 {newOperation.operation_type === 'CLIENT_SELLS_TO_EXCHANGE'
                    ? 'Сумма валюты (продажа)'
                    : 'Сумма рублей (покупка)'}
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  name="amount"
                  value={newOperation.amount}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Введите сумму..."
                />
              </div>
            </div>

            <div className="limits-info">
              <h3 className="limits-title">📊 Ограничения операций</h3>
              <div className="limits-grid">
                <div className="limit-item">
                  <div className="limit-icon">📈</div>
                  <div className="limit-content">
                    <div className="limit-label">Лимит одной операции</div>
                    <div className="limit-value">{formatDecimal(operationLimits.single_operation_amount)} ₽</div>
                  </div>
                </div>
                <div className="limit-item">
                  <div className="limit-icon">📊</div>
                  <div className="limit-content">
                    <div className="limit-label">Дневной лимит по валюте</div>
                    <div className="limit-value">{formatDecimal(operationLimits.daily_currency_volume)} ₽</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary"
              >
                {formLoading ? (
                  <>
                    <div className="loader"></div>
                    Обработка...
                  </>
                ) : (
                  <>
                    <span>💸</span>
                    Создать операцию
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* История операций */}
        <div className="operations-list-section">
          <h2 className="section-title">📋 История операций</h2>
          
          {loading && (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Загрузка операций...</p>
            </div>
          )}

          {!loading && operations.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <h3>Нет операций</h3>
              <p>Начните с создания первой операции обмена валют</p>
            </div>
          )}

          {!loading && operations.length > 0 && (
            <div className="operations-table-container">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>🔢 ID</th>
                    <th>🔄 Тип операции</th>
                    <th>👤 Клиент</th>
                    <th>💱 Валюта</th>
                    <th>💰 Сумма валюты</th>
                    <th>💰 Сумма рублей</th>
                    <th>📈 Курс</th>
                    <th>📅 Дата</th>
                    <th>⚙️ Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map(op => (
                    <tr key={op.id} className="operation-row">
                      <td className="id-cell">
                        <span className="operation-id">#{op.id}</span>
                      </td>
                      <td className="type-cell">
                        <span className={`operation-type ${op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? 'sell' : 'buy'}`}>
                          <span className="type-icon">
                            {op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? '📤' : '📥'}
                          </span>
                          <span className="type-text">
                            {op.operation_type === 'CLIENT_SELLS_TO_EXCHANGE' ? 'Продажа' : 'Покупка'}
                          </span>
                        </span>
                      </td>
                      <td className="client-cell">
                        <span className="client-name">
                          {op.client_name || op.client_full_name || `ID: ${op.client_id}`}
                        </span>
                      </td>
                      <td className="currency-cell">
                        <span className="currency-badge">
                          {op.currency_code}
                        </span>
                      </td>
                      <td className="amount-cell">
                        <span className="currency-amount">
                          {formatDecimal(op.amount_currency)}
                        </span>
                      </td>
                      <td className="rub-amount-cell">
                        <span className="rub-amount">
                          {formatDecimal(op.amount_rub)} ₽
                        </span>
                      </td>
                      <td className="rate-cell">
                        <span className="effective-rate">
                          {formatRate(op.effective_rate)}
                        </span>
                      </td>
                      <td className="date-cell">
                        <span className="operation-date">
                          {formatDate(op.operation_timestamp)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => openReceipt(op.receipt_reference)}
                          className="btn-receipt"
                          title="Просмотр чека"
                        >
                          <span>👁️</span>
                          Чек
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Пагинация */}
          {!loading && operations.length > 0 && (
            <div className="pagination-section">
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="pagination-btn"
                >
                  ← Предыдущая
                </button>
                <span className="page-info">Страница {currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={operations.length < pageSize || loading}
                  className="pagination-btn"
                >
                  Следующая →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsPage;