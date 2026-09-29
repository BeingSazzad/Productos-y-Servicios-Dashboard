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
    expect(mapped.parentId).toBeNull()
  })

  it('maps parentId and nested subCategories correctly', () => {
    const raw = {
      _id: '6a76eb808624bba43547e992',
      name: 'TECHNOLOGY AND ELECTRONICS',
      type: 'product',
      parentId: null,
      subCategories: [
        {
          _id: '6ab4ad48404b54973cbdd006',
          name: 'COMPUTERS AND LAPTOPS',
          type: 'product',
          parentId: '6a76eb808624bba43547e992',
          status: 'active',
          listingsCount: 0,
        },
      ],
    }

    const mapped = mapBackendCategory(raw)

    expect(mapped.id).toBe('6a76eb808624bba43547e992')
    expect(mapped.parentId).toBeNull()
    expect(mapped.subCategories).toHaveLength(1)
    expect(mapped.subCategories?.[0].id).toBe('6ab4ad48404b54973cbdd006')
    expect(mapped.subCategories?.[0].name).toBe('COMPUTERS AND LAPTOPS')
    expect(mapped.subCategories?.[0].parentId).toBe('6a76eb808624bba43547e992')
  })
})
