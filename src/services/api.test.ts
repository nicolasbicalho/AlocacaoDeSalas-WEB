import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, type AxiosAdapter } from 'axios'
import api, { loginUrlFor } from './api'

// Responde 401 TOKEN_EXPIRED a qualquer token que não seja o renovado.
const adapter: AxiosAdapter = async (config) => {
  if (config.headers.Authorization === 'Bearer access-new') {
    return { data: { success: true, data: config.url }, status: 200, statusText: 'OK', headers: {}, config }
  }
  const response = {
    data: { success: false, error: { code: 'TOKEN_EXPIRED' } },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  }
  throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, null, response)
}

describe('api — refresh automático', () => {
  const originalAdapter = api.defaults.adapter

  beforeEach(() => {
    api.defaults.adapter = adapter
    localStorage.setItem('alocacao_access_token', 'access-old')
    localStorage.setItem('alocacao_refresh_token', 'refresh-old')
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renova o token e repete a requisição sem o usuário perceber', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, data: { accessToken: 'access-new', refreshToken: 'refresh-new' } },
    })

    const { data } = await api.get('/projects')

    expect(data.data).toBe('/projects')
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][1]).toEqual({ refreshToken: 'refresh-old' })
    expect(localStorage.getItem('alocacao_access_token')).toBe('access-new')
    expect(localStorage.getItem('alocacao_refresh_token')).toBe('refresh-new')
  })

  it('requisições paralelas expiradas compartilham um único refresh', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, data: { accessToken: 'access-new', refreshToken: 'refresh-new' } },
    })

    const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])

    expect(results.map((r) => r.data.data)).toEqual(['/a', '/b', '/c'])
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('refresh falho limpa os tokens e rejeita a requisição', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('REFRESH_TOKEN_INVALID'))
    vi.spyOn(console, 'error').mockImplementation(() => {}) // jsdom não navega ao trocar location.href

    await expect(api.get('/projects')).rejects.toBeInstanceOf(AxiosError)
    expect(localStorage.getItem('alocacao_access_token')).toBeNull()
    expect(localStorage.getItem('alocacao_refresh_token')).toBeNull()
  })
})

describe('loginUrlFor', () => {
  it('preserva caminho, query e hash em redirect', () => {
    expect(loginUrlFor({ pathname: '/projects/1/schedule', search: '?date=2026-10-30', hash: '' })).toBe(
      '/login?redirect=%2Fprojects%2F1%2Fschedule%3Fdate%3D2026-10-30',
    )
  })

  it('não aninha redirect quando já está no login', () => {
    expect(loginUrlFor({ pathname: '/login', search: '?redirect=%2Fx', hash: '' })).toBe('/login')
  })
})
