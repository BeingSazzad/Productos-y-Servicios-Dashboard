import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

interface GoogleLocationMapProps {
  active: boolean
  latitude: string
  longitude: string
}

declare global {
  interface Window {
    google?: { maps: any }
  }
}

let mapsLoader: Promise<void> | null = null

function loadGoogleMaps(apiKey: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.maps) return Promise.resolve()
  if (mapsLoader) return mapsLoader

  mapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = 'true'
    script.onload = () => resolve()
    script.onerror = () => {
      mapsLoader = null
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return mapsLoader
}

function parsePoint(latitude: string, longitude: string) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (latitude === '' || longitude === '' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  return { lat, lng }
}

export function GoogleLocationMap({ active, latitude, longitude }: GoogleLocationMapProps) {
  const apiKey = env.googleMapsApiKey
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const pointRef = useRef(parsePoint(latitude, longitude))
  const [loadError, setLoadError] = useState('')
  const point = parsePoint(latitude, longitude)
  pointRef.current = point

  useEffect(() => {
    if (!active || !apiKey) return

    let cancelled = false

    const init = async () => {
      try {
        await loadGoogleMaps(apiKey)
        if (cancelled || !mapRef.current || !window.google?.maps) return

        const current = pointRef.current
        const center = current || { lat: 20, lng: 0 }
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: current ? 12 : 2,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
        })
        markerInstance.current = new window.google.maps.Marker({
          map: mapInstance.current,
          draggable: false,
          clickable: false,
          position: current || undefined,
        })

        window.setTimeout(() => {
          if (cancelled || !window.google?.maps || !mapInstance.current) return
          window.google.maps.event.trigger(mapInstance.current, 'resize')
          mapInstance.current.setCenter(pointRef.current || center)
        }, 280)
      } catch {
        if (!cancelled) setLoadError('Could not load Google Maps. Check the API key and try again.')
      }
    }

    void init()

    return () => {
      cancelled = true
      markerInstance.current = null
      mapInstance.current = null
    }
    // Initialize once when the modal opens; marker position is synced separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, apiKey])

  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps) return
    if (!point) {
      markerInstance.current?.setMap(null)
      return
    }
    if (markerInstance.current) {
      markerInstance.current.setMap(mapInstance.current)
      markerInstance.current.setPosition(point)
    }
    mapInstance.current.setCenter(point)
    mapInstance.current.setZoom(12)
  }, [point?.lat, point?.lng])

  if (!apiKey) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 text-center text-sm text-ink-500">
        {point
          ? `Location: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
          : 'Select a city to see its location.'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className={cn('h-52 w-full overflow-hidden rounded-lg border border-ink-200 bg-ink-50')}
      />
      {loadError ? (
        <p className="text-xs text-red-600">{loadError}</p>
      ) : (
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {point ? (
            <span>
              Lat {point.lat.toFixed(4)}, Lng {point.lng.toFixed(4)}
            </span>
          ) : (
            <span>Select a city to preview it on the map.</span>
          )}
        </div>
      )}
    </div>
  )
}
