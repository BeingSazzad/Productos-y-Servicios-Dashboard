import { describe, expect, it } from 'vitest'
import { mapBackendAdminToAdmin } from './adminsApi'

describe('mapBackendAdminToAdmin', () => {
  it('correctly maps raw backend admin object from GET /users/create-admin', () => {
    const raw = {
      _id: '6a817a6bcd74795fbabd1f6a',
      name: 'Emam Bokhari',
      role: 'admin',
      email: 'emam1@gmail.com',
      profileImage: '',
      status: 'active',
      createdAt: '2026-08-16T08:52:59.932Z',
      updatedAt: '2026-08-17T10:22:21.249Z',
    }

    const mapped = mapBackendAdminToAdmin(raw)

    expect(mapped.id).toBe('6a817a6bcd74795fbabd1f6a')
    expect(mapped._id).toBe('6a817a6bcd74795fbabd1f6a')
    expect(mapped.name).toBe('Emam Bokhari')
    expect(mapped.email).toBe('emam1@gmail.com')
    expect(mapped.role).toBe('admin')
    expect(mapped.status).toBe('active')
    expect(mapped.createdAt).toBe('2026-08-16T08:52:59.932Z')
    expect(mapped.updatedAt).toBe('2026-08-17T10:22:21.249Z')
  })
})
