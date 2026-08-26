import { describe, expect, it } from 'vitest'
import { mapBackendBannerToBanner, mapBackendFaqToFaq } from './cmsApi'

describe('mapBackendBannerToBanner', () => {
  it('correctly transforms raw GET /banners/all backend object into Banner model', () => {
    const raw = {
      _id: '6a7d3c561bdc423450bb92d0',
      name: 'test test',
      description: 'b',
      image: '/uploads/image/frame-2147226136-1786592342239.png',
      status: 'active',
      isDeleted: false,
      createdAt: '2026-08-13T03:39:02.245Z',
      updatedAt: '2026-08-13T03:39:02.245Z',
    }

    const mapped = mapBackendBannerToBanner(raw)

    expect(mapped.id).toBe('6a7d3c561bdc423450bb92d0')
    expect(mapped.name).toBe('test test')
    expect(mapped.title).toBe('test test')
    expect(mapped.description).toBe('b')
    expect(mapped.image).toBe('/uploads/image/frame-2147226136-1786592342239.png')
    expect(mapped.imageUrl).toBe('/uploads/image/frame-2147226136-1786592342239.png')
    expect(mapped.status).toBe('active')
    expect(mapped.isActive).toBe(true)
    expect(mapped.isDeleted).toBe(false)
  })

  it('correctly sets isActive to false when backend status is inactive', () => {
    const raw = {
      _id: '6a7d3c561bdc423450bb92d0',
      name: 'test test',
      description: 'b',
      image: '/uploads/image/frame-2147226136-1786592342239.png',
      status: 'inactive',
      isDeleted: false,
    }

    const mapped = mapBackendBannerToBanner(raw)

    expect(mapped.status).toBe('inactive')
    expect(mapped.isActive).toBe(false)
  })
})

describe('mapBackendFaqToFaq', () => {
  it('correctly transforms raw GET /faqs backend object into Faq model', () => {
    const rawFaq = {
      _id: '6a8685a48ecf4b44174885be',
      question: 'Q1',
      answer: 'A1',
      isDeleted: false,
      createdAt: '2026-08-20T04:42:12.037Z',
      updatedAt: '2026-08-20T04:42:12.037Z',
    }

    const mapped = mapBackendFaqToFaq(rawFaq)

    expect(mapped.id).toBe('6a8685a48ecf4b44174885be')
    expect(mapped.question).toBe('Q1')
    expect(mapped.answer).toBe('A1')
    expect(mapped.isDeleted).toBe(false)
  })
})
