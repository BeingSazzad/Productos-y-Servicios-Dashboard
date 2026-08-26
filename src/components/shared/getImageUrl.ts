export const imageUrl = (path?: string | null) => {
  if (!path || typeof path !== 'string') {
    return ''
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path
  } else {
    const baseUrl = import.meta.env.VITE_IMAGE_URL || ''
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${cleanBase}${cleanPath}`
  }
}

export default imageUrl