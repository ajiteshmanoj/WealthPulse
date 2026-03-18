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
export const getHistoricalCrises = () => api.get('/historical-crises').then(r => r.data);
export const runWhatIf = (data) => api.post('/whatif', data).then(r => r.data);
export const getTaxData = (userId) => api.get(`/tax/${userId}`).then(r => r.data);
export const getClientReport = (clientId) => api.post('/ai/client-report', { client_id: clientId }).then(r => r.data);
export const getRebalancePlan = (userId, proposedAllocations) => api.post('/whatif/rebalance-plan', { user_id: userId, proposed_allocations: proposedAllocations }).then(r => r.data);
