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
        buy_rate: Number(buyRate.toFixed(8)),
        sell_rate: Number(sellRate.toFixed(8)),
      };

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
        sell_rate: Number(sellRate.toFixed(8)),
      };

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

  return (
    <div className="main-content">
      <div className="container">
        <h1 className="page-title">💱 Управление валютами</h1>
        <p className="page-subtitle">
          Настройка курсов валют и ограничений для операций обмена
        </p>

        {/* Навигационные табы */}
        <div className="currency-tabs">
          <button 
            className={`tab-button ${activeTab === 'currencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('currencies')}
          >
            <span className="tab-icon">💰</span>
            Валюты и курсы
          </button>
          <button 
            className={`tab-button ${activeTab === 'limits' ? 'active' : ''}`}
            onClick={() => setActiveTab('limits')}
          >
            <span className="tab-icon">⚙️</span>
            Ограничения операций
          </button>
        </div>

        {/* Содержимое табов */}
        {activeTab === 'currencies' && (
          <div className="tab-content-area">
            {/* Форма добавления/редактирования валюты */}
            <div className="currency-form-section">
              <h2 className="section-title">
                {editCurrency ? '✏️ Редактирование валюты' : '➕ Добавить новую валюту'}
              </h2>
              
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={editCurrency ? handleUpdateCurrency : handleCreateCurrency} className="currency-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Код валюты</label>
                    <input 
                      value={editCurrency ? editCurrency.code : newCurrency.code} 
                      onChange={(e) => editCurrency 
                        ? setEditCurrency({ ...editCurrency, code: e.target.value }) 
                        : setNewCurrency({ ...newCurrency, code: e.target.value })
                      } 
                      placeholder="USD, EUR, GBP..." 
                      required 
                      disabled={editCurrency !== null}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Наименование</label>
                    <input 
                      value={editCurrency ? editCurrency.name : newCurrency.name} 
                      onChange={(e) => editCurrency 
                        ? setEditCurrency({ ...editCurrency, name: e.target.value }) 
                        : setNewCurrency({ ...newCurrency, name: e.target.value })
                      } 
                      placeholder="Доллар США..." 
                      required 
                      disabled={editCurrency !== null}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Курс покупки ₽</label>
                    <input 
                      type="number" 
                      step="0.00000001" 
                      value={editCurrency ? editCurrency.buy_rate : newCurrency.buy_rate} 
                      onChange={(e) => editCurrency 
                        ? setEditCurrency({ ...editCurrency, buy_rate: e.target.value }) 
                        : setNewCurrency({ ...newCurrency, buy_rate: e.target.value })
                      } 
                      placeholder="90.50" 
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Курс продажи ₽</label>
                    <input 
                      type="number" 
                      step="0.00000001" 
                      value={editCurrency ? editCurrency.sell_rate : newCurrency.sell_rate} 
                      onChange={(e) => editCurrency 
                        ? setEditCurrency({ ...editCurrency, sell_rate: e.target.value }) 
                        : setNewCurrency({ ...newCurrency, sell_rate: e.target.value })
                      } 
                      placeholder="89.50" 
                      required
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
                        Обработка...
                      </>
                    ) : (
                      <>
                        <span>{editCurrency ? '💾' : '➕'}</span>
                        {editCurrency ? 'Обновить валюту' : 'Добавить валюту'}
                      </>
                    )}
                  </button>
                  {editCurrency && (
                    <button 
                      type="button" 
                      onClick={() => setEditCurrency(null)}
                      className="btn-secondary"
                    >
                      <span>❌</span>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Таблица валют */}
            <div className="currencies-table-section">
              <h2 className="section-title">📊 Список валют</h2>
              
              {loading && (
                <div className="loading-state">
                  <div className="loader"></div>
                  <p>Загрузка валют...</p>
                </div>
              )}

              {!loading && currencies.length > 0 && (
                <div className="table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Код</th>
                        <th>Наименование</th>
                        <th>Курс покупки</th>
                        <th>Курс продажи</th>
                        <th>Спред</th>
                        <th>Обновлено</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currencies.map(currency => {
                        const buyRate = parseFloat(currency.buy_rate);
                        const sellRate = parseFloat(currency.sell_rate);
                        const spread = ((buyRate - sellRate) / sellRate * 100).toFixed(2);
                        
                        return (
                          <tr key={currency.id} className="table-row">
                            <td>
                              <div className="currency-code">
                                {currency.code}
                              </div>
                            </td>
                            <td>
                              <div className="currency-name">
                                {currency.name}
                              </div>
                            </td>
                            <td>
                              <div className="rate buy-rate">
                                <span className="rate-value">{formatRate(currency.buy_rate)}</span>
                                <span className="rate-currency">₽</span>
                              </div>
                            </td>
                            <td>
                              <div className="rate sell-rate">
                                <span className="rate-value">{formatRate(currency.sell_rate)}</span>
                                <span className="rate-currency">₽</span>
                              </div>
                            </td>
                            <td>
                              <div className="spread">
                                {spread}%
                              </div>
                            </td>
                            <td>
                              <div className="date">
                                {formatDate(currency.last_rate_update_at)}
                              </div>
                            </td>
                            <td>
                              <button 
                                onClick={() => setEditCurrency({ ...currency })}
                                className="btn-edit"
                                title="Редактировать курсы"
                              >
                                ✏️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && currencies.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">💱</div>
                  <h3>Валюты не найдены</h3>
                  <p>Начните с добавления первой валюты для обмена</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="tab-content-area">
            <div className="limits-section">
              <h2 className="section-title">⚙️ Ограничения операций</h2>
              
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Описание</th>
                      <th>Значение</th>
                      <th>Обновлено</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationLimits.map(limit => (
                      <tr key={limit.id} className="table-row">
                        <td>
                          <div className="limit-name">
                            {limit.limit_name}
                          </div>
                        </td>
                        <td>
                          <div className="limit-description">
                            {limit.description}
                          </div>
                        </td>
                        <td>
                          {editingLimit && editingLimit.id === limit.id ? (
                            <input 
                              type="number" 
                              step="0.0001" 
                              value={editingLimit.limit_value}
                              onChange={(e) => setEditingLimit({...editingLimit, limit_value: e.target.value})}
                              className="limit-input"
                            />
                          ) : (
                            <div className="limit-value">
                              {formatRate(limit.limit_value)} ₽
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="date">
                            {formatDate(limit.updated_at)}
                          </div>
                        </td>
                        <td>
                          {editingLimit && editingLimit.id === limit.id ? (
                            <div className="action-buttons">
                              <button 
                                onClick={handleUpdateLimit}
                                className="btn-save"
                                title="Сохранить"
                              >
                                💾
                              </button>
                              <button 
                                onClick={() => setEditingLimit(null)}
                                className="btn-cancel"
                                title="Отмена"
                              >
                                ❌
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingLimit({ ...limit })}
                              className="btn-edit"
                              title="Редактировать"
                            >
                              ✏️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrenciesPage;