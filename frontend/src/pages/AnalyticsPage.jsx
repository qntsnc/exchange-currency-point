import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Аналитика операций
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              С даты:
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="input w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              По дату:
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="input w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Валюта:
            </label>
            <select
              name="currency"
              value={filters.currency}
              onChange={handleFilterChange}
              className="input w-full"
            >
              <option value="all">Все валюты</option>
              {currencies.map(curr => (
                <option key={curr.id} value={curr.code}>{curr.code} ({curr.name})</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Тип операции:
            </label>
            <select
              name="operationType"
              value={filters.operationType}
              onChange={handleFilterChange}
              className="input w-full"
            >
              <option value="all">Все типы</option>
              <option value="buy">Покупка</option>
              <option value="sell">Продажа</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleApplyFilters}
            className="btn btn-primary"
          >
            Применить
          </button>
        </div>
      </div>

      {!loading && !analyticsData && !error && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            Нажмите "Применить", чтобы загрузить аналитические данные.
          </p>
        </div>
      )}

      {!loading && analyticsData && analyticsData.total_operations === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            Нет данных для указанного периода и фильтров.
          </p>
        </div>
      )}

      {!loading && analyticsData && analyticsData.total_operations > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Общая статистика
            </h3>
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
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              График операций
            </h3>
            <SimpleBarChart
              title="Распределение типов операций"
              data={[analyticsData.client_sells_count, analyticsData.client_buys_count]}
              labels={['Клиент продает валюту', 'Клиент покупает валюту']}
              colors={['#4caf50', '#2196f3']}
            />
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Популярные валюты
            </h3>
            <div className="currency-volumes">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;