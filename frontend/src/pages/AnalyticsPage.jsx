import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    currency: 'all',
    operationType: 'all'
  });

  const formatDecimal = (value) => (value === null || value === undefined ? 'N/A' : parseFloat(value).toFixed(2));
  const formatRate = (value) => (value === null || value === undefined ? 'N/A' : parseFloat(value).toFixed(4));
  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/currencies');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      const data = await response.json();
      setCurrencies(data.data || []);
    } catch (err) {
      console.error('Error fetching currencies:', err);
      setError(prev => prev ? `${prev}; Ошибка загрузки валют: ${err.message}` : `Ошибка загрузки валют: ${err.message}`);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL('http://localhost:8080/api/v1/analytics/operations');
      url.searchParams.append('start_date', filters.startDate);
      url.searchParams.append('end_date', filters.endDate);
      if (filters.currency !== 'all' && filters.currency) url.searchParams.append('currency_code', filters.currency);
      if (filters.operationType !== 'all' && filters.operationType) url.searchParams.append('operation_type', filters.operationType);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to fetch analytics data (${response.status})`);
      }
      const data = await response.json();
      setAnalyticsData(data.data || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Ошибка загрузки аналитических данных: ' + err.message);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchAnalytics();
  };

  const AnalyticsChart = ({ title, data, labels, colors, type = 'bar' }) => {
    const total = data.reduce((sum, val) => sum + val, 0);
    
    if (type === 'donut') {
      return (
        <div className="chart-container donut-chart">
          <h4 className="chart-title">{title}</h4>
          <div className="donut-wrapper">
            <div className="donut">
              {data.map((value, i) => {
                const percentage = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="donut-segment"
                    style={{
                      '--percentage': `${percentage}`,
                      '--color': colors[i % colors.length],
                      '--offset': data.slice(0, i).reduce((sum, val) => sum + (total > 0 ? (val / total) * 100 : 0), 0)
                    }}
                  />
                );
              })}
            </div>
            <div className="donut-center">
              <span className="donut-total">{total}</span>
              <span className="donut-label">Всего</span>
            </div>
          </div>
          <div className="chart-legend">
            {labels.map((label, i) => (
              <div key={i} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="legend-label">{label}</span>
                <span className="legend-value">{data[i]} ({total > 0 ? ((data[i] / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="chart-container bar-chart">
        <h4 className="chart-title">{title}</h4>
        <div className="bars-wrapper">
          {data.map((value, i) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={i} className="bar-item">
                <div className="bar-label">{labels[i]}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                  >
                    <span className="bar-value">{value}</span>
                  </div>
                </div>
                <div className="bar-percentage">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="container">
        <h1 className="page-title">📊 Аналитика операций</h1>

        {/* Фильтры */}
        <div className="analytics-filters">
          <h2 className="filters-title">🔍 Фильтры и настройки</h2>
          
          <div className="filters-grid">
            <div className="filter-field">
              <label>📅 Начальная дата</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            
            <div className="filter-field">
              <label>📅 Конечная дата</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            
            <div className="filter-field">
              <label>💱 Валюта</label>
              <select
                name="currency"
                value={filters.currency}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">Все валюты</option>
                {currencies.map(curr => (
                  <option key={curr.id} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-field">
              <label>🔄 Тип операции</label>
              <select
                name="operationType"
                value={filters.operationType}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">Все типы</option>
                <option value="buy">Покупка валюты</option>
                <option value="sell">Продажа валюты</option>
              </select>
            </div>
          </div>
          
          <div className="filters-actions">
            <button
              onClick={handleApplyFilters}
              className="btn-apply-filters"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loader"></div>
                  Загрузка...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Применить фильтры
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Пустое состояние */}
        {!loading && !analyticsData && !error && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Данные не загружены</h3>
            <p>Настройте фильтры и нажмите "Применить фильтры" для загрузки аналитических данных</p>
          </div>
        )}

        {/* Нет данных */}
        {!loading && analyticsData && analyticsData.total_operations === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Нет данных</h3>
            <p>За выбранный период и с указанными фильтрами операций не найдено</p>
          </div>
        )}

        {/* Основные данные */}
        {!loading && analyticsData && analyticsData.total_operations > 0 && (
          <div className="analytics-content">
            {/* Основная статистика */}
            <div className="analytics-overview">
              <h2 className="section-title">📈 Общая статистика</h2>
              
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{analyticsData.total_operations}</div>
                    <div className="stat-label">Всего операций</div>
                  </div>
                </div>
                
                <div className="stat-card success">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatCurrency(analyticsData.total_amount_rub)}</div>
                    <div className="stat-label">Общий оборот</div>
                  </div>
                </div>
                
                <div className="stat-card warning">
                  <div className="stat-icon">📤</div>
                  <div className="stat-content">
                    <div className="stat-value">{analyticsData.client_sells_count}</div>
                    <div className="stat-label">Продаж клиентами</div>
                    <div className="stat-sublabel">{formatCurrency(analyticsData.client_sells_rub_total)}</div>
                  </div>
                </div>
                
                <div className="stat-card info">
                  <div className="stat-icon">📥</div>
                  <div className="stat-content">
                    <div className="stat-value">{analyticsData.client_buys_count}</div>
                    <div className="stat-label">Покупок клиентами</div>
                    <div className="stat-sublabel">{formatCurrency(analyticsData.client_buys_rub_total)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Графики и детальная статистика */}
            <div className="analytics-details">
              <div className="analytics-row">
                {/* Распределение операций */}
                <div className="analytics-card">
                  <AnalyticsChart
                    title="Распределение операций"
                    data={[analyticsData.client_sells_count, analyticsData.client_buys_count]}
                    labels={['Продажи клиентов', 'Покупки клиентов']}
                    colors={['#ef4444', '#3b82f6']}
                    type="donut"
                  />
                </div>

                {/* Популярные валюты */}
                <div className="analytics-card">
                  <h3 className="card-title">💎 Популярные валюты</h3>
                  <div className="currency-list">
                    {analyticsData.currency_volumes.slice(0, 5).map((cv, index) => (
                      <div key={index} className="currency-item">
                        <div className="currency-info">
                          <div className="currency-code">{cv.currency_code}</div>
                          <div className="currency-name">{cv.currency_name}</div>
                        </div>
                        <div className="currency-stats">
                          <div className="currency-volume">{formatDecimal(cv.volume)}</div>
                          <div className="currency-rub">{formatCurrency(cv.rub_volume)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Средние курсы */}
              {Object.keys(analyticsData.average_rates).length > 0 && (
                <div className="analytics-card full-width">
                  <h3 className="card-title">💹 Средние курсы за период</h3>
                  <div className="rates-grid">
                    {Object.entries(analyticsData.average_rates).map(([currency, rate]) => (
                      <div key={currency} className="rate-card">
                        <div className="rate-currency">{currency}</div>
                        <div className="rate-value">{formatRate(rate)} ₽</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Подробная таблица валют */}
              {analyticsData.currency_volumes.length > 0 && (
                <div className="analytics-card full-width">
                  <h3 className="card-title">📋 Детальная статистика по валютам</h3>
                  <div className="table-container">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Валюта</th>
                          <th>Код</th>
                          <th>Объем в валюте</th>
                          <th>Объем в рублях</th>
                          <th>Доля от общего оборота</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.currency_volumes.map((cv, index) => {
                          const percentage = (cv.rub_volume / analyticsData.total_amount_rub * 100).toFixed(1);
                          return (
                            <tr key={index}>
                              <td>
                                <div className="table-currency-name">{cv.currency_name}</div>
                              </td>
                              <td>
                                <div className="table-currency-code">{cv.currency_code}</div>
                              </td>
                              <td>
                                <div className="table-volume">{formatDecimal(cv.volume)}</div>
                              </td>
                              <td>
                                <div className="table-rub-volume">{formatCurrency(cv.rub_volume)}</div>
                              </td>
                              <td>
                                <div className="table-percentage">
                                  <div className="percentage-bar">
                                    <div 
                                      className="percentage-fill" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span>{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;