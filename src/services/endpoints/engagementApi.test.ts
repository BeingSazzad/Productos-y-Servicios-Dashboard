import { describe, expect, it } from 'vitest'
import { mapBackendAnnouncement } from './engagementApi'

describe('engagementApi mapper', () => {
  it('maps raw production backend announcement object correctly', () => {
    const raw = {
      _id: '6a87da2fc4515f4cf49e696d',
      title: 'Welcome to our platform!',
      message: '<p>We have updated our services. Check out the latest offers today!</p>',
      audience: 'everyone',
      channel: 'push_notification',
      status: 'sent',
      createdBy: {
        _id: '6a76eaa1e0c04cc25974e04c',
        name: 'Super Admin',
        role: 'super_admin',
        email: 'admin@gmail.com',
      },
      isDeleted: false,
      createdAt: '2026-08-21T04:55:11.062Z',
      updatedAt: '2026-08-21T04:55:11.373Z',
      sentAt: '2026-08-21T04:55:11.373Z',
    }

    const mapped = mapBackendAnnouncement(raw)

    expect(mapped.id).toBe('6a87da2fc4515f4cf49e696d')
    expect(mapped._id).toBe('6a87da2fc4515f4cf49e696d')
    expect(mapped.title).toBe('Welcome to our platform!')
    expect(mapped.message).toBe('<p>We have updated our services. Check out the latest offers today!</p>')
    expect(mapped.body).toBe('<p>We have updated our services. Check out the latest offers today!</p>')
    expect(mapped.audience).toBe('everyone')
    expect(mapped.channel).toBe('push_notification')
    expect(mapped.status).toBe('sent')
    expect(typeof mapped.createdBy).toBe('object')
    if (typeof mapped.createdBy === 'object') {
      expect(mapped.createdBy.name).toBe('Super Admin')
    }
  })
})
