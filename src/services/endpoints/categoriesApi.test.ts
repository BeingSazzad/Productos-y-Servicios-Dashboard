import { describe, expect, it } from 'vitest'
import { mapBackendCategory } from './categoriesApi'

describe('categoriesApi mapper', () => {
  it('maps raw backend category object to Category model', () => {
    const raw = {
      _id: '6a76eb808624bba43547e992',
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      type: 'product',
      status: 'active',
      isDeleted: false,
    }

    const mapped = mapBackendCategory(raw)

    expect(mapped.id).toBe('6a76eb808624bba43547e992')
    expect(mapped.name).toBe('Electronics')
    expect(mapped.type).toBe('product')
    expect(mapped.isActive).toBe(true)
    expect(mapped.status).toBe('active')
  })
})
