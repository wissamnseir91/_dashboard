import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

interface LoginResponse {
  user: User
  token: string
}

// Present only when the server has email-OTP 2FA enabled (production —
// see backend/config/otp.php) — absent everywhere else, in which case
// login() behaves exactly as if OTP didn't exist.
interface OtpRequiredResponse {
  requires_otp: true
  email: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<LoginResponse | OtpRequiredResponse>('/auth/login', payload)
      return data
    },
    onSuccess: (data) => {
      if ('token' in data) {
        setAuth(data.user, data.token)
      }
    },
  })
}

interface VerifyOtpPayload {
  email: string
  code: string
  remember: boolean
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (payload: VerifyOtpPayload) => {
      const { data } = await api.post<LoginResponse>('/auth/verify-otp', payload)
      return data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSettled: () => {
      logout()
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
      return data
    },
  })
}

interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
      return data
    },
  })
}
