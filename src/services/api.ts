import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alocacao_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Login preservando a página atual em `redirect` (o LoginView volta para ela). */
export function loginUrlFor(location: Pick<Location, 'pathname' | 'search' | 'hash'>): string {
  const { pathname, search, hash } = location
  if (pathname === '/login') return '/login'
  return `/login?redirect=${encodeURIComponent(pathname + search + hash)}`
}

// A API rotaciona o refresh token: requisições paralelas que expiram juntas
// precisam esperar o MESMO refresh, senão a segunda usa um token já revogado.
let refreshing: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = localStorage.getItem('alocacao_refresh_token')
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
      )
      localStorage.setItem('alocacao_access_token', data.data.accessToken)
      localStorage.setItem('alocacao_refresh_token', data.data.refreshToken)
      return data.data.accessToken as string
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const errorCode = error.response?.data?.error?.code

    if (error.response?.status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newAccessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('alocacao_access_token')
        localStorage.removeItem('alocacao_refresh_token')
        window.location.href = loginUrlFor(window.location)
      }
    }

    return Promise.reject(error)
  },
)

export default api
