import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem('routeflow_token');
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('routeflow_token')) {
      localStorage.removeItem('routeflow_token');
      localStorage.removeItem('routeflow_user');
      window.dispatchEvent(new Event('routeflow:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? error.message;
  return error instanceof Error ? error.message : 'Something went wrong';
}
