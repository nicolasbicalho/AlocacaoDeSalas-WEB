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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const errorCode = error.response?.data?.error?.code

    if (error.response?.status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('alocacao_refresh_token')
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken },
        )
        const newAccessToken = data.data.accessToken
        localStorage.setItem('alocacao_access_token', newAccessToken)
        localStorage.setItem('alocacao_refresh_token', data.data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('alocacao_access_token')
        localStorage.removeItem('alocacao_refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
