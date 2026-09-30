import { Country, State, City } from 'country-state-city'

export interface LocationCountry {
  name: string
  isoCode: string
}

export interface LocationProvince {
  key: string
  name: string
  isoCode: string
  countryCode: string
  latitude?: string
  longitude?: string
}

export interface LocationCity {
  key: string
  name: string
  stateCode: string
  countryCode?: string
  latitude: string
  longitude: string
}

function cityKey(name: string, stateCode: string, latitude: string, longitude: string) {
  return `${name}|${stateCode}|${latitude}|${longitude}`
}

export function getCountries(): LocationCountry[] {
  return Country.getAllCountries()
    .map((country) => ({ name: country.name, isoCode: country.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findCountry(isoOrName: string): LocationCountry | undefined {
  const query = isoOrName.trim().toLowerCase()
  if (!query) return undefined
  return getCountries().find(
    (country) => country.isoCode.toLowerCase() === query || country.name.toLowerCase() === query,
  )
}

export function getProvincesByCountry(isoCode: string): LocationProvince[] {
  if (!isoCode) return []
  const states = State.getStatesOfCountry(isoCode) || []
  return states
    .map((state) => ({
      key: `${state.countryCode}|${state.isoCode}|${state.name}`,
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode,
      latitude: state.latitude ? String(state.latitude) : undefined,
      longitude: state.longitude ? String(state.longitude) : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findProvince(isoCode: string, codeOrName: string): LocationProvince | undefined {
  const query = codeOrName.trim().toLowerCase()
  if (!isoCode || !query) return undefined
  return getProvincesByCountry(isoCode).find(
    (p) => p.isoCode.toLowerCase() === query || p.name.toLowerCase() === query,
  )
}

export function getCitiesByCountry(isoCode: string): LocationCity[] {
  if (!isoCode) return []
  const cities = City.getCitiesOfCountry(isoCode) || []
  return cities
    .filter((city) => city.latitude && city.longitude)
    .map((city) => ({
      key: cityKey(city.name, city.stateCode || '', String(city.latitude), String(city.longitude)),
      name: city.name,
      stateCode: city.stateCode || '',
      countryCode: city.countryCode || isoCode,
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.stateCode.localeCompare(b.stateCode))
}

export function getCitiesByProvince(countryCode: string, provinceCode?: string): LocationCity[] {
  if (!countryCode) return []
  let cities = provinceCode ? City.getCitiesOfState(countryCode, provinceCode) || [] : []
  if (cities.length === 0 && !provinceCode) {
    cities = City.getCitiesOfCountry(countryCode) || []
  }
  if (cities.length === 0 && provinceCode) {
    const all = City.getCitiesOfCountry(countryCode) || []
    const matched = all.filter((c) => c.stateCode?.toLowerCase() === provinceCode.toLowerCase())
    if (matched.length > 0) {
      cities = matched
    }
  }
  return (cities || [])
    .filter((city) => city.latitude && city.longitude)
    .map((city) => ({
      key: cityKey(city.name, city.stateCode || '', String(city.latitude), String(city.longitude)),
      name: city.name,
      stateCode: city.stateCode || '',
      countryCode: city.countryCode || countryCode,
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findCity(
  isoCode: string,
  cityName: string,
  provinceCode?: string,
): LocationCity | undefined {
  const query = cityName.trim().toLowerCase()
  if (!isoCode || !query) return undefined
  if (provinceCode) {
    const inProv = getCitiesByProvince(isoCode, provinceCode).find(
      (city) => city.name.toLowerCase() === query,
    )
    if (inProv) return inProv
  }
  return getCitiesByCountry(isoCode).find((city) => city.name.toLowerCase() === query)
}

export function makeCustomCity(
  name: string,
  latitude: string | number,
  longitude: string | number,
  stateCode = '',
): LocationCity {
  const lat = String(latitude)
  const lng = String(longitude)
  return {
    key: cityKey(name, stateCode || 'custom', lat, lng),
    name,
    stateCode,
    countryCode: '',
    latitude: lat,
    longitude: lng,
  }
}

export function getProvinceSelectOptions(provinces: LocationProvince[]) {
  return provinces.map((p) => ({
    label: p.name,
    value: p.isoCode,
  }))
}

export function getCitySelectOptions(cities: LocationCity[]) {
  const nameCounts = cities.reduce<Record<string, number>>((acc, city) => {
    acc[city.name] = (acc[city.name] || 0) + 1
    return acc
  }, {})

  return cities.map((city) => ({
    label:
      nameCounts[city.name] > 1 && city.stateCode ? `${city.name} (${city.stateCode})` : city.name,
    value: city.key,
  }))
}
