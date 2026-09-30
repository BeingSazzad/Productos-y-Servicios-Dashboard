import { describe, expect, it } from 'vitest'
import { mapBackendAdvertisementPayment } from './advertisementsApi'

describe('mapBackendAdvertisementPayment', () => {
  it('maps a paid advertisement payment from the list payload', () => {
    const mapped = mapBackendAdvertisementPayment({
      id: '6a8d0db411f0311d2ae00c8d',
      seller: { id: 'u1', name: 'Moshfiqur Rahman', email: 'studentemam@gmail.com', profileImage: null },
      store: { id: 's1', displayName: 'Tech Zone', storeType: 'product_store' },
      amountPaid: 10,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      invoiceNumber: 'INV-2026-1000',
      isTrial: false,
      package: { id: 'p1', name: 'MEMBRESÍA SEMESTRAL', duration: 'six_month', price: 12 },
      subscription: { status: 'active', remainingDays: 8, isExpired: false },
    })

    expect(mapped.id).toBe('6a8d0db411f0311d2ae00c8d')
    expect(mapped.seller?.name).toBe('Moshfiqur Rahman')
    expect(mapped.store?.displayName).toBe('Tech Zone')
    expect(mapped.amountPaid).toBe(10)
    expect(mapped.paymentStatus).toBe('PAID')
    expect(mapped.package?.duration).toBe('six_month')
    expect(mapped.isTrial).toBe(false)
  })

  it('maps a nested city object without crashing the details view', () => {
    const mapped = mapBackendAdvertisementPayment({
      id: 'pay-1',
      amountPaid: 10,
      paymentStatus: 'PAID',
      city: {
        id: 'city-1',
        name: 'Dhaka',
        country: 'Bangladesh',
        countryCode: 'BD',
        latitude: 23.81,
        longitude: 90.41,
      },
      position: { position: 2 },
    })

    expect(mapped.city?.name).toBe('Dhaka')
    expect(mapped.city?.country).toBe('Bangladesh')
    expect(mapped.position).toBe(2)
  })

  it('maps a trial payment with empty store name', () => {
    const mapped = mapBackendAdvertisementPayment({
      id: 'trial-1',
      amountPaid: 0,
      paymentStatus: 'TRIAL',
      isTrial: true,
      store: { id: 's2', displayName: null, logo: '/uploads/logo/a.jpg' },
    })

    expect(mapped.paymentStatus).toBe('TRIAL')
    expect(mapped.store?.displayName).toBeNull()
    expect(mapped.amountPaid).toBe(0)
  })
})
