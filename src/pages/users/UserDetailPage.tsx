import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, Mail, Phone } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingState } from '@/components/ui/Spinner'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useGetUserQuery, useUpdateUserStatusMutation } from '@/services/endpoints/usersApi'
import { formatDate } from '@/lib/format'

export default function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: user, isLoading } = useGetUserQuery(id)
  const [updateStatus, { isLoading: updating }] = useUpdateUserStatusMutation()
  const [banOpen, setBanOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading || !user) return <LoadingState />

  const isSuspended = user.status === 'inactive' || user.status === 'suspended'

  const handleBan = async () => {
    await updateStatus({ id: user.id, status: 'inactive', reason: reason.trim() || undefined })
    setBanOpen(false)
    setReason('')
  }

  const handleReactivate = () => updateStatus({ id: user.id, status: 'active' })

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      <PageHeader
        title={user.name}
        description={`Joined ${formatDate(user.createdAt)}`}
        actions={
          isSuspended ? (
            <Button onClick={handleReactivate} loading={updating}>
              <CheckCircle2 className="h-4 w-4" /> Reactivate
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setBanOpen(true)}>
              <Ban className="h-4 w-4" /> Deactivate user
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" className="h-20 w-20 text-xl" />
            <h3 className="mt-3 text-lg font-semibold text-ink-900">{user.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={user.status} />
              {user.storeName && <Badge tone="purple">Store owner</Badge>}
            </div>
            {isSuspended && user.banReason && (
              <div className="mt-4 w-full rounded-lg bg-red-50 px-3 py-2 text-left text-xs text-red-700 ring-1 ring-red-600/20">
                <span className="font-medium">Ban reason:</span> {user.banReason}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Account details" />
          <CardBody className="space-y-4">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone ?? '—'} />
            <DetailRow label="Store" value={user.storeName ?? 'No store'} />
          </CardBody>
        </Card>
      </div>

      <Modal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title="Ban this user?"
        description="They will lose access to the marketplace until reactivated."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBanOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBan} loading={updating}>
              Ban user
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for ban"
          placeholder="e.g. Repeated policy violations, fraudulent activity…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint="Shared with the moderation team and recorded in the audit log."
        />
      </Modal>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-50 pb-3 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-ink-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-ink-900">{value}</span>
    </div>
  )
}
