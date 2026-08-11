import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import { login, forgotPassword, resetPassword, logout } from './auth.service'

vi.mock('@/services/api')

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should return tokens and user from the API response envelope', async () => {
      const payload = {
        accessToken: 'access-abc',
        refreshToken: 'refresh-xyz',
        user: { id: '1', name: 'Ana', email: 'ana@x.com', role: 'professor' as const },
      }
      vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: payload } })

      const result = await login('ana@x.com', 'senha1234')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ana@x.com',
        password: 'senha1234',
      })
      expect(result).toEqual(payload)
    })

    it('should propagate errors so the view can handle them', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('401'))
      await expect(login('ana@x.com', 'wrong')).rejects.toThrow('401')
    })
  })

  describe('forgotPassword', () => {
    it('should return the dev resetToken from the response', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: { resetToken: 'reset-123' } },
      })
      const result = await forgotPassword('ana@x.com')
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'ana@x.com' })
      expect(result.resetToken).toBe('reset-123')
    })
  })

  describe('resetPassword', () => {
    it('should post the token and the new password', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: {} } })
      await resetPassword('reset-123', 'novaSenha123')
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        resetToken: 'reset-123',
        newPassword: 'novaSenha123',
      })
    })
  })

  describe('logout', () => {
    it('should post the refresh token to revoke it', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: {} })
      await logout('refresh-xyz')
      expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-xyz' })
    })
  })
})
