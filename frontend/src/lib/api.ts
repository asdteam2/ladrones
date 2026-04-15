import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL
const isProd = import.meta.env.PROD
const apiBaseUrl = configuredApiUrl || (isProd ? '/api' : 'http://localhost:4000/api')

if (isProd && !configuredApiUrl) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL no esta configurado en produccion. La app usara /api (mismo origen).')
}

export const api = axios.create({
  baseURL: apiBaseUrl,
})

export function setAuthToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization
    return
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`
}
