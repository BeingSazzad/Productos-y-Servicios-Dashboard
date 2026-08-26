import { describe, expect, it } from 'vitest'
import { mapBackendSubscriptionToSubscription, mapBackendPackageToPlan } from './billingApi'

describe('mapBackendSubscriptionToSubscription', () => {
  it('correctly transforms real GET /subscriptions raw backend object into Subscription model', () => {
    const raw = {
      _id: '6a7ff3db10ecd7c577214a5b',
      stripeSubscriptionId: 'sub_1U4ZnfQOpYWE7pDH6QlTei8B',
      amountPaid: 29.99,
      createdAt: '2026-08-15T05:06:34.781Z',
      expiresAt: '2026-09-22T05:06:31.000Z',
      isDeleted: false,
      packageId: {
        _id: '6a7ff377c24d0046a564c737',
        name: 'Store Creation Premium',
        price: 29.99,
        duration: 'seven_days',
        status: 'active',
        packageType: 'store_creation',
        listingLimit: 100,
        isUnlimitedListings: false,
        trialEnabled: false,
        trialPeriodDays: 30,
        stripeProductId: 'prod_V4jEjOFa0PYwSt',
        stripePriceId: 'price_1U4Zm7QOpYWE7pDH9QPOxfVS',
        features: [
          'Create store',
          'Up to 100 listings',
          'Premium store visibility',
          'Priority support',
        ],
        isDeleted: false,
        createdAt: '2026-08-15T05:04:55.107Z',
        updatedAt: '2026-08-15T05:04:55.107Z',
      },
      packageType: 'store_creation',
      status: 'active',
      stripeSessionId: 'cs_test_a1clvqzAbAsZzY093rOEm5bwPmYjsbylZMWTvXdYkcvDSRnjrmcJZztzbY',
      trxId: '',
      updatedAt: '2026-08-15T05:06:35.187Z',
      userId: {
        _id: '6a76edddda03657909bcbd43',
        name: 'Moshfiqur Rahman',
        email: 'studentemam@gmail.com',
        profileImage: '',
        phone: '1315773424',
      },
      store: {
        _id: '6a76ee14da03657909bcbd56',
        owner: '6a76edddda03657909bcbd43',
        storeType: 'product_store',
        displayName: 'TechZone BD',
        description: 'A trusted online store for electronics, gadgets and computer accessories.',
        categoryId: {
          _id: '6a76eb808624bba43547e992',
          name: 'Electronics',
        },
        logo: '/uploads/logo/frame-2147226136-1786179092449.png',
        coverImage: '/uploads/coverImage/frame-2147226136-1786179092449.png',
        phone: '+8801712345678',
        whatsapp: '+8801712345678',
        email: 'contact@techzonebd.com',
        streetAddress: 'House 24, Road 5, Mirpur',
        city: 'Dhaka',
        postalCode: '1216',
        latitude: 23.8223,
        longitude: 90.3654,
        businessLicenseNumber: 'BL-DHK-2026-001245',
        tradeLicense: '/uploads/tradeLicense/frame-2147226136-1786179092449.png',
        tinNumber: '123456789012',
        status: 'active',
        isDeleted: false,
        createdAt: '2026-08-08T08:51:32.650Z',
        updatedAt: '2026-08-19T05:57:10.789Z',
        documentBack: '/uploads/documentBack/frame-2147226136-1786603709531.png',
        documentFront: '/uploads/documentFront/frame-2147226136-1786603709530.png',
        documentType: 'nid',
        isVerified: true,
        averageRating: 5,
        ratingCount: 1,
        visitorCount: 3,
      },
    }

    const mapped = mapBackendSubscriptionToSubscription(raw)

    expect(mapped.id).toBe('6a7ff3db10ecd7c577214a5b')
    expect(mapped.storeId).toBe('6a76ee14da03657909bcbd56')
    expect(mapped.storeName).toBe('TechZone BD')
    expect(mapped.ownerName).toBe('Moshfiqur Rahman')
    expect(mapped.storeType).toBe('product')
    expect(mapped.planId).toBe('6a7ff377c24d0046a564c737')
    expect(mapped.planName).toBe('Store Creation Premium')
    expect(mapped.amount).toBe(29.99)
    expect(mapped.status).toBe('active')
    expect(mapped.stripeSubscriptionId).toBe('sub_1U4ZnfQOpYWE7pDH6QlTei8B')
    expect(mapped.packageId?.name).toBe('Store Creation Premium')
    expect(mapped.userId?.email).toBe('studentemam@gmail.com')
    expect(mapped.store?.city).toBe('Dhaka')
  })

  it('correctly transforms real GET /subscription-packages raw backend object into Plan model', () => {
    const rawPackage = {
      _id: '6a7ff377c24d0046a564c737',
      name: 'Store Creation Premium',
      price: 29.99,
      duration: 'seven_days',
      status: 'active',
      packageType: 'store_creation',
      listingLimit: 100,
      isUnlimitedListings: false,
      trialEnabled: false,
      trialPeriodDays: 30,
      stripeProductId: 'prod_V4jEjOFa0PYwSt',
      stripePriceId: 'price_1U4Zm7QOpYWE7pDH9QPOxfVS',
      features: [
        'Create store',
        'Up to 100 listings',
        'Premium store visibility',
        'Priority support',
      ],
      isDeleted: false,
      createdAt: '2026-08-15T05:04:55.107Z',
      updatedAt: '2026-08-15T05:04:55.107Z',
    }

    const mapped = mapBackendPackageToPlan(rawPackage)

    expect(mapped.id).toBe('6a7ff377c24d0046a564c737')
    expect(mapped.name).toBe('Store Creation Premium')
    expect(mapped.price).toBe(29.99)
    expect(mapped.duration).toBe('seven_days')
    expect(mapped.status).toBe('active')
    expect(mapped.packageType).toBe('store_creation')
    expect(mapped.listingLimit).toBe(100)
    expect(mapped.isUnlimitedListings).toBe(false)
    expect(mapped.trialEnabled).toBe(false)
    expect(mapped.trialPeriodDays).toBe(30)
    expect(mapped.features).toHaveLength(4)
    expect(mapped.isActive).toBe(true)
  })
})
