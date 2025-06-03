// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://backend:8080/api/v1';

export const API_ENDPOINTS = {
  clients: `${API_BASE_URL}/clients`,
  currencies: `${API_BASE_URL}/currencies`,
  operations: `${API_BASE_URL}/operations`,
  analytics: `${API_BASE_URL}/analytics/operations`,
  receipts: (reference) => `${API_BASE_URL}/receipts/${reference}`,
  operationReceipt: (id) => `${API_BASE_URL}/operations/${id}/receipt`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
}; 