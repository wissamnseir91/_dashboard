import axios from 'axios'
import { mockAdapter } from '@/mock/api'
import { useAuthStore } from '@/stores/auth'

// Sample build: requests never leave the browser. `mockAdapter` answers every
// call from the in-memory dummy data in src/mock/data.js. To talk to a real
// backend instead, delete the `adapter` line and set `baseURL`.
export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  adapter: mockAdapter,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)
