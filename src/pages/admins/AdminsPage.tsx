import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminStatusMutation,
  useDeleteAdminMutation,
} from '@/services/endpoints/adminsApi'
import type { Admin } from '@/types/models'

const roleTone: Record<string, BadgeTone> = {
  super_admin: 'purple',
  admin: 'blue',
  moderator: 'amber',
  support: 'gray',
}

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
}

export default function AdminsPage() {
  const { data: admins, isLoading } = useGetAdminsQuery()
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation()
  const [updateStatus, { isLoading: statusUpdating }] = useUpdateAdminStatusMutation()
  const [deleteAdmin, { isLoading: deleting }] = useDeleteAdminMutation()

  const [creatingOpen, setCreatingOpen] = useState(false)
  const [toDeleteAdmin, setToDeleteAdmin] = useState<Admin | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  })

  useEffect(() => {
    if (creatingOpen) {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
      })
    }
  }, [creatingOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'admin',
      }).unwrap()
      toast.success(`Admin "${form.name}" created successfully!`)
      setCreatingOpen(false)
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save admin account.',
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!toDeleteAdmin) return
    try {
      await deleteAdmin(toDeleteAdmin.id).unwrap()
      toast.success(`Admin "${toDeleteAdmin.name}" deleted successfully!`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete admin.')
    } finally {
      setToDeleteAdmin(null)
    }
  }

  const columns: Column<Admin>[] = [
    {
      key: 'admin',
      header: 'Admin',
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} src={a.profileImage} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{a.name}</p>
            <p className="text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (a) => (
        <Badge tone={roleTone[a.role] || 'gray'}>
          {roleLabel[a.role] || a.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (a) => (
        <Switch
          checked={a.status === 'active'}
          disabled={a.role === 'super_admin' || statusUpdating}
          onChange={async (checked) => {
            const nextStatus = checked ? 'active' : 'inactive'
            try {
              await updateStatus({ id: a.id, status: nextStatus }).unwrap()
              toast.success(`Admin "${a.name}" status updated to ${nextStatus}!`)
            } catch (err: any) {
              toast.error(err?.data?.message || err?.message || 'Failed to update admin status.')
            }
          }}
          label={`Toggle status for ${a.name}`}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          {a.role === 'super_admin' ? (
            <span className="text-xs text-ink-400">Protected</span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setToDeleteAdmin(a)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Team members with administrative access to this dashboard."
        actions={
          <Button onClick={() => setCreatingOpen(true)}>
            <Plus className="h-4 w-4" /> Add admin
          </Button>
        }
      />

      <Card>
        <Table columns={columns} rows={admins ?? []} rowKey={(a) => a.id} loading={isLoading} />
      </Card>

      {/* Form Modal for Creating Admin */}
      <Modal
        open={creatingOpen}
        onClose={() => setCreatingOpen(false)}
        title="Add New Admin"
        description="Create a new admin account to manage the dashboard."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCreatingOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" form="admin-form" loading={creating}>
              Create admin
            </Button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Enter full name"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Enter password"
            required
          />
          <Input
            label="Role"
            value="Admin"
            readOnly
            disabled
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(toDeleteAdmin)}
        title={`Delete admin "${toDeleteAdmin?.name}"?`}
        description="This action will permanently delete the admin account from the database."
        confirmLabel="Delete admin"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDeleteAdmin(null)}
      />
    </div>
  )
}
