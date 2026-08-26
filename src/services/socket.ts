import { io, Socket } from 'socket.io-client'
import { STORAGE_KEYS } from '@/lib/constants'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const rawApiUrl =
      (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
      (import.meta.env.VITE_IMAGE_URL as string | undefined) ||
      (import.meta.env.VITE_API_URL as string | undefined) ||
      'http://localhost:5009'

    let socketUrl = rawApiUrl
    try {
      const parsed = new URL(rawApiUrl)
      socketUrl = parsed.origin
    } catch {
      socketUrl = 'http://localhost:5009'
    }

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.token) ||
          localStorage.getItem('token') ||
          localStorage.getItem('access_token')
        : null

    const formattedToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : ''

    socket = io(socketUrl, {
      auth: { token: formattedToken, authorization: formattedToken },
      query: { token: formattedToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })
  }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
