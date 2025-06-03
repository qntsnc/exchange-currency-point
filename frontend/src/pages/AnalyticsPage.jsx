import React, { useState, useEffect, useCallback } from 'react';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    currencyCode: '',
    operationType: ''
  });

  const formatDecimal = (value) => (value === null || value === undefined ? 'N/A' : parseFloat(value).toFixed(2));
  const formatRate = (value) => (value === null || value === undefined ? 'N/A' : parseFloat(value).toFixed(4));

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
      if (filters.currencyCode) url.searchParams.append('currency_code', filters.currencyCode);
      if (filters.operationType) url.searchParams.append('operation_type', filters.operationType);

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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchAnalytics();
  };

  const SimpleBarChart = ({ title, data, labels, colors }) => {
    const total = data.reduce((sum, val) => sum + val, 0);
    return (
      <div className="bar-chart">
        <h4>{title}</h4>
        <div className="bars-container">
          {data.map((value, i) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={i} className="bar-item">
                <div
                  className="bar-fill"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: colors[i % colors.length],
                    transition: 'height 0.5s ease-in-out',
                  }}
                >
                  {percentage > 5 && <span>{value}</span>}
                </div>
                <div className="bar-label">{labels[i]} {percentage > 0 ? `(${percentage.toFixed(1)}%)` : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-page">
      <h2>Аналитика операций</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="analytics-filters">
        <div>
          <label htmlFor="startDate">С даты:</label>
          <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        </div>
        <div>
          <label htmlFor="endDate">По дату:</label>
          <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
        </div>
        <div>
          <label htmlFor="currencyCode">Валюта:</label>
          <select id="currencyCode" name="currencyCode" value={filters.currencyCode} onChange={handleFilterChange}>
            <option value="">Все валюты</option>
            {currencies.map(curr => (
              <option key={curr.id} value={curr.code}>{curr.code} ({curr.name})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="operationType">Тип операции:</label>
          <select id="operationType" name="operationType" value={filters.operationType} onChange={handleFilterChange}>
            <option value="">Все типы</option>
            <option value="CLIENT_SELLS_TO_EXCHANGE">Клиент продаёт валюту</option>
            <option value="CLIENT_BUYS_FROM_EXCHANGE">Клиент покупает валюту</option>
          </select>
        </div>
        <button onClick={handleApplyFilters}>Применить</button>
      </div>

        {loading && <p className="loading-message">Загрузка данных...</p>}

        {!loading && !analyticsData && !error && (
          <div style={{width: 'full', height:'full'}}  className="no-data-message">
            <p>Нажмите "Применить", чтобы загрузить аналитические данные.</p>
          </div>
      )}

      {!loading && analyticsData && analyticsData.total_operations === 0 && (
        <div className="no-data-message">
          <p>Нет данных для указанного периода и фильтров.</p>
        </div>
      )}

      {!loading && analyticsData && analyticsData.total_operations > 0 && (
        <div className="analytics-container">
          <div className="summary-section">
            <h3>Сводная информация</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Всего операций</h4>
                <p className="summary-value">{analyticsData.total_operations}</p>
              </div>
              <div className="summary-card">
                <h4>Общий объем в рублях</h4>
                <p className="summary-value">{formatDecimal(analyticsData.total_amount_rub)} ₽</p>
              </div>
              <div className="summary-card">
                <h4>Продажи валюты</h4>
                <p className="summary-value">
                  {analyticsData.client_sells_count} операций / {formatDecimal(analyticsData.client_sells_rub_total)} ₽
                </p>
              </div>
              <div className="summary-card">
                <h4>Покупки валюты</h4>
                <p className="summary-value">
                  {analyticsData.client_buys_count} операций / {formatDecimal(analyticsData.client_buys_rub_total)} ₽
                </p>
              </div>
              {Object.entries(analyticsData.average_rates).map(([currency, rate]) => (
                <div key={`rate-${currency}`} className="summary-card">
                  <h4>Средний курс {currency}</h4>
                  <p className="summary-value">{formatRate(rate)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h3>Типы операций</h3>
            <SimpleBarChart
              title="Распределение типов операций"
              data={[analyticsData.client_sells_count, analyticsData.client_buys_count]}
              labels={['Клиент продает валюту', 'Клиент покупает валюту']}
              colors={['#4caf50', '#2196f3']}
            />
          </div>

          <div className="currency-volumes">
            <h3>Объемы по валютам</h3>
            <table>
              <thead>
                <tr>
                  <th>Валюта</th>
                  <th>Код</th>
                  <th>Объем в валюте</th>
                  <th>Объем в рублях</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.currency_volumes.map((cv, index) => (
                  <tr key={index}>
                    <td>{cv.currency_name}</td>
                    <td>{cv.currency_code}</td>
                    <td>{formatDecimal(cv.volume)}</td>
                    <td>{formatDecimal(cv.rub_volume)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="daily-breakdown">
            <h3>Детализация по дням</h3>
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Количество операций</th>
                  <th>Объем (руб)</th>
                  <th>Продажи клиентов</th>
                  <th>Покупки клиентов</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.daily_operations.map((day, index) => (
                  <tr key={index}>
                    <td>{day.date}</td>
                    <td>{day.count}</td>
                    <td>{formatDecimal(day.amount_rub)} ₽</td>
                    <td>{day.client_sells_count} (объем: {formatDecimal(day.client_sells_volume)})</td>
                    <td>{day.client_buys_count} (объем: {formatDecimal(day.client_buys_volume)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;