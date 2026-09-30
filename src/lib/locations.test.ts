import { describe, expect, it } from 'vitest'
import {
  findCity,
  findCountry,
  findProvince,
  getCitiesByCountry,
  getCitiesByProvince,
  getCountries,
  getProvincesByCountry,
} from './locations'

describe('locations', () => {
  it('includes Bangladesh with ISO code BD', () => {
    const country = findCountry('Bangladesh')
    expect(country?.isoCode).toBe('BD')
    expect(findCountry('BD')?.name).toBe('Bangladesh')
    expect(getCountries().some((item) => item.isoCode === 'BD')).toBe(true)
  })

  it('returns cities for a country with default coordinates', () => {
    const dhaka = findCity('BD', 'Dhaka')
    expect(dhaka).toBeDefined()
    expect(Number(dhaka?.latitude)).not.toBeNaN()
    expect(Number(dhaka?.longitude)).not.toBeNaN()
    expect(getCitiesByCountry('BD').length).toBeGreaterThan(1)
  })

  it('returns provinces for Ecuador and cities within a province', () => {
    const provinces = getProvincesByCountry('EC')
    expect(provinces.length).toBeGreaterThanOrEqual(24)

    const pichincha = findProvince('EC', 'Pichincha')
    expect(pichincha).toBeDefined()

    const cities = getCitiesByProvince('EC', pichincha?.isoCode)
    expect(cities.length).toBeGreaterThan(0)
    expect(cities.some((c) => c.name.toLowerCase().includes('quito'))).toBe(true)
  })
})

