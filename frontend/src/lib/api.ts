import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL

if (import.meta.env.PROD && !configuredApiUrl) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL no esta configurado en produccion. La app intentara usar localhost y fallara fuera de entorno local.')
}

export const api = axios.create({
  baseURL: configuredApiUrl || 'http://localhost:4000/api',
})

export function setAuthToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization
    return
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`
}
