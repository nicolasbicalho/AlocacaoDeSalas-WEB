import api from '@/services/api'
import type { AuthUser } from '@/types'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

/** POST /auth/login — autentica e retorna tokens + dados do usuário. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<{ success: true; data: LoginResult }>('/auth/login', {
    email,
    password,
  })
  return data.data
}

/** POST /auth/logout — revoga o refresh token no servidor. */
export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}

/**
 * POST /auth/forgot-password — solicita a recuperação de senha.
 * No MVP a API devolve o `resetToken` na resposta para facilitar o teste sem e-mail real.
 */
export async function forgotPassword(email: string): Promise<{ resetToken?: string }> {
  const { data } = await api.post<{ success: true; data: { resetToken?: string } }>(
    '/auth/forgot-password',
    { email },
  )
  return data.data
}

/** POST /auth/reset-password — redefine a senha a partir de um token válido. */
export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { resetToken, newPassword })
}
