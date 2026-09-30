import { useNavigate } from 'react-router-dom'
import { Ban, Eye, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { USER_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetUsersQuery, useUpdateUserStatusMutation } from '@/services/endpoints/usersApi'
import { ROUTES } from '@/constants/routes'
import type { User } from '@/types/models'

export default function UsersPage() {
  const navigate = useNavigate()
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetUsersQuery(params)
  const [updateStatus, { isLoading: updating }] = useUpdateUserStatusMutation()

  const columns: Column<User>[] = [
    { 
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{u.name}</p>
            <p className="text-xs text-ink-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'store',
      header: 'Store',
      render: (u) =>
        u.storeName ? (
          <span className="font-medium text-ink-900">{u.storeName}</span>
        ) : (
          <span className="text-ink-300">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => {
        const isInactive = u.status === 'inactive' || u.status === 'suspended'
        return (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.userDetail(u.id))}>
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
            {isInactive ? (
              <Button
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={() => updateStatus({ id: u.id, status: 'active' })}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Activate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="danger"
                disabled={updating}
                onClick={() => updateStatus({ id: u.id, status: 'inactive' })}
              >
                <Ban className="h-3.5 w-3.5" /> Deactivate
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Users" description="Buyers and sellers across the marketplace." />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={USER_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(u) => u.id}
          loading={isFetching}
          onRowClick={(u) => navigate(ROUTES.userDetail(u.id))}
          emptyTitle="No users found"
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>
    </div>
  )
}
