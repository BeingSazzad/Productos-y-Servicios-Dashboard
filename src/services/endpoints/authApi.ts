import { api } from '@/services/api'
import type { AdminProfile } from '@/components/auth/authSlice'

export const RESET_PASSWORD_TOKEN_KEY = 'reset_password_token'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AdminProfile
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  oneTimeCode: number
}

export interface ResendOtpRequest {
  email: string
}

export interface ResetPasswordRequest {
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  countryCode?: string
  gender?: string
  profileImage?: File
}

function mapUserToAdminProfile(userRaw: any): AdminProfile {
  if (!userRaw) {
    return {
      id: 'me',
      name: 'Super Admin',
      email: 'admin@gmail.com',
      role: 'super_admin',
    }
  }
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''
  const avatarUrl = userRaw.profileImage
    ? userRaw.profileImage.startsWith('http')
      ? userRaw.profileImage
      : `${imageUrlBase}${userRaw.profileImage}`
    : undefined

  return {
    id: String(userRaw._id || userRaw.id || ''),
    name: userRaw.name || 'Super Admin',
    email: userRaw.email || '',
    role: userRaw.role === 'super_admin' ? 'super_admin' : 'admin',
    avatarUrl,
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any): LoginResponse => {
        const payload = response?.data || response
        return {
          token: payload?.token || '',
          user: mapUserToAdminProfile(payload?.user),
        }
      },
      invalidatesTags: ['User'],
    }),

    forgotPassword: builder.mutation<{ success: boolean; message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forget-password',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => ({
        success: res?.success ?? true,
        message: res?.message || 'Verification code sent to email.',
      }),
    }),

    verifyOtp: builder.mutation<{ resetToken: string; message: string }, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => {
        const resetToken =
          typeof res?.data === 'string'
            ? res.data
            : (res?.data?.token || res?.resetToken || res?.token || '')
        if (resetToken && typeof localStorage !== 'undefined') {
          localStorage.setItem(RESET_PASSWORD_TOKEN_KEY, resetToken)
          localStorage.setItem('resettoken', resetToken)
        }
        return {
          resetToken,
          message: res?.message || 'Verification successful.',
        }
      },
    }),

    resendOtp: builder.mutation<{ success: boolean; message: string }, ResendOtpRequest>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => ({
        success: res?.success ?? true,
        message: res?.message || 'OTP resent successfully.',
      }),
    }),

    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (body) => {
        const resetToken =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY) || localStorage.getItem('resettoken')
            : null
        return {
          url: '/auth/reset-password',
          method: 'POST',
          body,
          headers: resetToken ? { resettoken: resetToken } : undefined,
        }
      },
      transformResponse: (res: any) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(RESET_PASSWORD_TOKEN_KEY)
          localStorage.removeItem('resettoken')
        }
        return {
          success: res?.success ?? true,
          message: res?.message || 'Password reset successfully.',
        }
      },
    }),

    getProfile: builder.query<AdminProfile, void>({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      transformResponse: (res: any) => mapUserToAdminProfile(res?.data || res),
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<
      { success: boolean; message: string; data: AdminProfile },
      UpdateProfileRequest
    >({
      query: ({ profileImage, ...fields }) => {
        const formData = new FormData()
        const dataPayload = Object.fromEntries(
          Object.entries(fields).filter(([, value]) => value !== undefined && value !== ''),
        )
        formData.append('data', JSON.stringify(dataPayload))
        if (profileImage) {
          formData.append('profileImage', profileImage)
        }
        return {
          url: '/users',
          method: 'PATCH',
          body: formData,
        }
      },
      transformResponse: (res: any) => ({
        success: res?.success ?? true,
        message: res?.message || 'Profile updated successfully',
        data: mapUserToAdminProfile(res?.data || res),
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<{ success: true; message?: string }, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => ({
        success: true,
        message: res?.message || 'Password changed successfully',
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi
