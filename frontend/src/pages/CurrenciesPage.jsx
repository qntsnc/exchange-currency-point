import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import './CurrenciesPage.css';

const CurrenciesPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', buy_rate: '', sell_rate: '' });
  const [editCurrency, setEditCurrency] = useState(null);
  const [activeTab, setActiveTab] = useState('currencies');
  const [operationLimits, setOperationLimits] = useState([
    { id: 1, limit_name: 'daily_currency_volume', limit_value: '1000.0', description: 'Максимальный объем операций с иностранной валютой для клиента за день', updated_at: new Date().toISOString() },
    { id: 2, limit_name: 'single_operation_amount', limit_value: '5000.0', description: 'Максимальная сумма одной операции', updated_at: new Date().toISOString() },
  ]);
  const [editingLimit, setEditingLimit] = useState(null);

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/v1/currencies');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setCurrencies(data.data || []);
    } catch (err) {
      setError('Ошибка загрузки валют: ' + err.message);
      console.error('Fetch currencies error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCurrency = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Валидация
      if (!newCurrency.code || !newCurrency.name || !newCurrency.buy_rate || !newCurrency.sell_rate) {
        throw new Error('Все поля обязательны');
      }
      const buyRate = parseFloat(newCurrency.buy_rate);
      const sellRate = parseFloat(newCurrency.sell_rate);
      if (isNaN(buyRate) || buyRate <= 0) {
        throw new Error('Курс покупки должен быть положительным числом');
      }
      if (isNaN(sellRate) || sellRate <= 0) {
        throw new Error('Курс продажи должен быть положительным числом');
      }

      const payload = {
        code: newCurrency.code,
        name: newCurrency.name,
        buy_rate: buyRate.toFixed(8), // Форматируем как строку
        sell_rate: sellRate.toFixed(8),
      };
      console.log('Creating currency payload:', payload);
      const response = await fetch('http://localhost:8080/api/v1/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to create currency (${response.status})`);
      }
      fetchCurrencies();
      setNewCurrency({ code: '', name: '', buy_rate: '', sell_rate: '' });
    } catch (err) {
      setError('Ошибка создания валюты: ' + err.message);
      console.error('Create currency error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrency = async (e) => {
    e.preventDefault();
    if (!editCurrency) return;
    setLoading(true);
    setError('');
    try {
      // Валидация
      if (!editCurrency.code || !editCurrency.buy_rate || !editCurrency.sell_rate) {
        throw new Error('Все поля обязательны');
      }
      const buyRate = parseFloat(editCurrency.buy_rate);
      const sellRate = parseFloat(editCurrency.sell_rate);
      if (isNaN(buyRate) || buyRate <= 0) {
        throw new Error('Курс покупки должен быть положительным числом');
      }
      if (isNaN(sellRate) || sellRate <= 0) {
        throw new Error('Курс продажи должен быть положительным числом');
      }

      const payload = {
        code: editCurrency.code,
        buy_rate: Number(buyRate.toFixed(8)),
        sell_rate: Number(sellRate.toFixed(8)) ,
      };
      console.log('Updating currency payload:', payload);
      const response = await fetch('http://localhost:8080/api/v1/currencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = `Failed to update currency (${response.status})`;
        try {
          const errData = await response.json();
          message = errData.message || message;
          if (message.includes('not found')) {
            message = 'Валюта не найдена';
          } else if (message.includes('Invalid buy_rate')) {
            message = 'Неверный формат курса покупки';
          } else if (message.includes('Invalid sell_rate')) {
            message = 'Неверный формат курса продажи';
          }
        } catch (jsonErr) {
          console.error('Error parsing error response:', jsonErr);
        }
        throw new Error(message);
      }
      fetchCurrencies();
      setEditCurrency(null);
    } catch (err) {
      setError('Ошибка обновления валюты: ' + err.message);
      console.error('Update currency error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = (e) => {
    e.preventDefault();
    if (!editingLimit) return;
    setOperationLimits(prev =>
      prev.map(limit =>
        limit.id === editingLimit.id ? { ...limit, limit_value: editingLimit.limit_value, updated_at: new Date().toISOString() } : limit
      )
    );
    setEditingLimit(null);
  };

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const formatRate = (rateStr) => {
    if (!rateStr) return 'N/A';
    const num = parseFloat(rateStr);
    return isNaN(num) ? rateStr : num.toFixed(6);
  };

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return 'Не указано';
    try {
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

  const getLimitDescription = (limitName) => {
    const descriptions = {
      'daily_currency_volume': 'Максимальный объем операций с иностранной валютой для клиента за день',
      'single_operation_amount': 'Максимальная сумма одной операции'
    };
    return descriptions[limitName] || limitName;
  };

  return (
    <div className="currencies-page">
      <div className="tabs">
        <div 
          className={activeTab === 'currencies' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('currencies')}
        >
          Валюты и курсы
        </div>
        <div 
          className={activeTab === 'limits' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('limits')}
        >
          Ограничения операций
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'currencies' && (
          <>
            <h2>Валюты и курсы</h2>
            {error && <p className="error-message">{error}</p>}
            
            <form onSubmit={editCurrency ? handleUpdateCurrency : handleCreateCurrency} className="currency-form">
              <div className="currency-form-fields">
                <input 
                  value={editCurrency ? editCurrency.code : newCurrency.code} 
                  onChange={(e) => editCurrency 
                    ? setEditCurrency({ ...editCurrency, code: e.target.value }) 
                    : setNewCurrency({ ...newCurrency, code: e.target.value })
                  } 
                  placeholder="Код валюты" 
                  required 
                  disabled={editCurrency !== null}
                  className="currency-input"
                />
                
                <input 
                  value={editCurrency ? editCurrency.name : newCurrency.name} 
                  onChange={(e) => editCurrency 
                    ? setEditCurrency({ ...editCurrency, name: e.target.value }) 
                    : setNewCurrency({ ...newCurrency, name: e.target.value })
                  } 
                  placeholder="Наименование" 
                  required 
                  disabled={editCurrency !== null}
                  className="currency-input"
                />
                
                <input 
                  type="number" 
                  step="0.00000001" 
                  value={editCurrency ? editCurrency.buy_rate : newCurrency.buy_rate} 
                  onChange={(e) => editCurrency 
                    ? setEditCurrency({ ...editCurrency, buy_rate: e.target.value }) 
                    : setNewCurrency({ ...newCurrency, buy_rate: e.target.value })
                  } 
                  placeholder="Курс покупки" 
                  required
                  className="currency-input"
                />
                
                <input 
                  type="number" 
                  step="0.00000001" 
                  value={editCurrency ? editCurrency.sell_rate : newCurrency.sell_rate} 
                  onChange={(e) => editCurrency 
                    ? setEditCurrency({ ...editCurrency, sell_rate: e.target.value }) 
                    : setNewCurrency({ ...newCurrency, sell_rate: e.target.value })
                  } 
                  placeholder="Курс продажи" 
                  required
                  className="currency-input"
                />
              </div>
              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-success"
                >
                  {editCurrency ? 'Обновить валюту' : 'Добавить валюту'}
                </button>
                {editCurrency && (
                  <button 
                    type="button" 
                    onClick={() => setEditCurrency(null)}
                    className="btn btn-danger"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
            {loading && <p>Загрузка валют...</p>}
            {!loading && currencies.length > 0 && (
              <table className="currencies-table">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Наименование</th>
                    <th>Курс покупки</th>
                    <th>Курс продажи</th>
                    <th>Последнее обновление</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map(currency => (
                    <tr key={currency.id}>
                      <td>{currency.code}</td>
                      <td>{currency.name}</td>
                      <td>{formatRate(currency.buy_rate)}</td>
                      <td>{formatRate(currency.sell_rate)}</td>
                      <td>{formatDate(currency.last_rate_update_at)}</td>
                      <td>
                        <button 
                          onClick={() => setEditCurrency({ ...currency })}
                          className="btn btn-primary btn-sm"
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && currencies.length === 0 && <p>Нет данных о валютах.</p>}
          </>
        )}
        {activeTab === 'limits' && (
          <>
            <h2>Ограничения операций</h2>
            <table className="currencies-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Значение</th>
                  <th>Последнее обновление</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {operationLimits.map(limit => (
                  <tr key={limit.id}>
                    <td>{limit.limit_name}</td>
                    <td>{limit.description}</td>
                    <td>
                      {editingLimit && editingLimit.id === limit.id ? (
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={editingLimit.limit_value}
                          onChange={(e) => setEditingLimit({...editingLimit, limit_value: e.target.value})}
                          className="currency-input limit-input"
                        />
                      ) : (
                        formatRate(limit.limit_value)
                      )}
                    </td>
                    <td>{formatDate(limit.updated_at)}</td>
                    <td>
                      {editingLimit && editingLimit.id === limit.id ? (
                        <>
                          <button 
                            onClick={handleUpdateLimit}
                            className="btn btn-success btn-sm"
                          >
                            Сохранить
                          </button>
                          <button 
                            onClick={() => setEditingLimit(null)}
                            className="btn btn-danger btn-sm"
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setEditingLimit({ ...limit })}
                          className="btn btn-primary btn-sm"
                        >
                          Редактировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrenciesPage;