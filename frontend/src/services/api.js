import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,
});

export const getPortfolio = (userId) => api.get(`/portfolio/${userId}`).then(r => r.data);
export const getWellness = (userId) => api.get(`/wellness/${userId}`).then(r => r.data);
export const getNews = () => api.get('/news').then(r => r.data);
export const runScenario = (data) => api.post('/scenario', data).then(r => r.data);
export const getRecommendations = (userId) => api.post('/ai/recommend', { user_id: userId }).then(r => r.data);
export const getClients = () => api.get('/clients').then(r => r.data);
export const getGoal = (userId) => api.get(`/goals/${userId}`).then(r => r.data);
export const calculateGoal = (data) => api.post('/goals/calculate', data).then(r => r.data);
export const analyzeExpenses = (data) => api.post('/goals/expenses', data).then(r => r.data);
