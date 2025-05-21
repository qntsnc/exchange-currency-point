import React, { useState, useEffect, useCallback } from 'react';

const CurrenciesPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', buy_rate: '', sell_rate: '', rate_to_usd: '' });
  const [editCurrency, setEditCurrency] = useState(null);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCurrency = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurrency),
      });
      if (!response.ok) throw new Error('Failed to create currency');
      fetchCurrencies();
      setNewCurrency({ code: '', name: '', buy_rate: '', sell_rate: '', rate_to_usd: '' });
    } catch (err) {
      setError('Ошибка создания валюты: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrency = async (e) => {
    e.preventDefault();
    if (!editCurrency) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/currencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCurrency.code,
          buy_rate: editCurrency.buy_rate,
          sell_rate: editCurrency.sell_rate,
          rate_to_usd: editCurrency.rate_to_usd,
        }),
      });
      if (!response.ok) throw new Error('Failed to update currency');
      fetchCurrencies();
      setEditCurrency(null);
    } catch (err) {
      setError('Ошибка обновления валюты: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const formatRate = (rateStr) => {
    if (!rateStr) return 'N/A';
    const num = parseFloat(rateStr);
    return isNaN(num) ? rateStr : num.toFixed(6);
  };

  return (
    <div>
      <h2>Валюты и Курсы</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={editCurrency ? handleUpdateCurrency : handleCreateCurrency}>
        <input value={editCurrency ? editCurrency.code : newCurrency.code} onChange={(e) => 
          editCurrency ? setEditCurrency({ ...editCurrency, code: e.target.value }) : setNewCurrency({ ...newCurrency, code: e.target.value })} 
          placeholder="Code" required disabled={editCurrency !== null} />
        <input value={editCurrency ? editCurrency.name : newCurrency.name} onChange={(e) => 
          editCurrency ? setEditCurrency({ ...editCurrency, name: e.target.value }) : setNewCurrency({ ...newCurrency, name: e.target.value })} 
          placeholder="Name" required disabled={editCurrency !== null} />
        <input type="number" step="0.00000001" value={editCurrency ? editCurrency.buy_rate : newCurrency.buy_rate} onChange={(e) => 
          editCurrency ? setEditCurrency({ ...editCurrency, buy_rate: e.target.value }) : setNewCurrency({ ...newCurrency, buy_rate: e.target.value })} 
          placeholder="Buy Rate" required />
        <input type="number" step="0.00000001" value={editCurrency ? editCurrency.sell_rate : newCurrency.sell_rate} onChange={(e) => 
          editCurrency ? setEditCurrency({ ...editCurrency, sell_rate: e.target.value }) : setNewCurrency({ ...newCurrency, sell_rate: e.target.value })} 
          placeholder="Sell Rate" required />
        <input type="number" step="0.00000001" value={editCurrency ? editCurrency.rate_to_usd : newCurrency.rate_to_usd} onChange={(e) => 
          editCurrency ? setEditCurrency({ ...editCurrency, rate_to_usd: e.target.value }) : setNewCurrency({ ...newCurrency, rate_to_usd: e.target.value })} 
          placeholder="Rate to USD" required />
        <button type="submit" disabled={loading}>{editCurrency ? 'Обновить валюту' : 'Добавить валюту'}</button>
        {editCurrency && <button type="button" onClick={() => setEditCurrency(null)}>Отмена</button>}
      </form>
      {loading && <p>Загрузка валют...</p>}
      {!loading && currencies.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Код</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Наименование</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Курс покупки</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Курс продажи</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Последнее обновление курса</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map(currency => (
              <tr key={currency.id} style={{ border: '1px solid #ddd' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{currency.code}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{currency.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatRate(currency.buy_rate)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatRate(currency.sell_rate)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(currency.last_rate_update_at).toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button onClick={() => setEditCurrency({ ...currency })}>Редактировать</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && currencies.length === 0 && <p>Нет данных о валютах.</p>}
    </div>
  );
};

export default CurrenciesPage;