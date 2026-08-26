import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { STORAGE_KEYS } from '@/lib/constants'

export interface AdminProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'super_admin'
  avatarUrl?: string
  phone?: string
  gender?: string
}

interface AuthState {
  token: string | null
  user: AdminProfile | null
}

function loadInitial(): AuthState {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token)
    const userRaw = localStorage.getItem(STORAGE_KEYS.user)
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as AdminProfile) : null,
    }
  } catch {
    return { token: null, user: null }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AdminProfile }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      localStorage.setItem(STORAGE_KEYS.token, action.payload.token)
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(action.payload.user))
    },
    updateProfile(state, action: PayloadAction<{ name?: string; avatarUrl?: string | null }>) {
      if (!state.user) return
      if (action.payload.name !== undefined) state.user.name = action.payload.name
      if (action.payload.avatarUrl !== undefined) {
        state.user.avatarUrl = action.payload.avatarUrl ?? undefined
      }
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user))
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(STORAGE_KEYS.token)
      localStorage.removeItem(STORAGE_KEYS.user)
    },
  },
})

export const { setCredentials, updateProfile, logout } = authSlice.actions
export default authSlice.reducer
