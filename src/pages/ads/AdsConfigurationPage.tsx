import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Eye, Image as ImageIcon, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { GoogleLocationMap } from '@/components/shared/GoogleLocationMap'
import { imageUrl } from '@/components/shared/getImageUrl'
import { toast } from '@/components/ui/Toast'
import { useListParams } from '@/hooks/useListParams'
import { PAGE_SIZE } from '@/lib/constants'
import {
  findCity,
  findCountry,
  findProvince,
  getCitiesByProvince,
  getCitySelectOptions,
  getCountries,
  getProvincesByCountry,
  getProvinceSelectOptions,
  makeCustomCity,
} from '@/lib/locations'
import { formatDate } from '@/lib/format'
import { formatCurrency } from '@/lib/utils'
import {
  useGetCityAdConfigsQuery,
  useCreateCityAdConfigMutation,
  useUpdateCityAdConfigMutation,
  useDeleteCityAdConfigMutation,
  type CityAdConfigInput,
} from '@/services/endpoints/cityAdConfigApi'
import type { CityAdConfiguration, FeaturedPositionPrice } from '@/types/models'
import type { EntityStatus, Option } from '@/types/common.types'

const STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const COUNTRY_OPTIONS: Option[] = getCountries().map((country) => ({
  label: country.name,
  value: country.isoCode,
}))

interface FormPositionPrice {
  position: number
  price: number | string
}

function syncPricing(
  capacity: number,
  existing: Array<{ position: number; price?: number | string }> = [],
): FormPositionPrice[] {
  const n = Math.max(0, Math.floor(Number(capacity) || 0))
  return Array.from({ length: n }, (_, i) => ({
    position: i + 1,
    price:
      existing[i]?.price !== undefined && existing[i]?.price !== null && existing[i]?.price !== ''
        ? existing[i]!.price
        : '',
  }))
}

function toPayloadPricing(pricing: FormPositionPrice[]): FeaturedPositionPrice[] {
  return pricing.map((item) => ({
    position: item.position,
    price: Number(item.price) || 0,
  }))
}


export default function AdsConfigurationPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetCityAdConfigsQuery({ ...params, pageSize: PAGE_SIZE })
  const [deleteConfig, { isLoading: deleting }] = useDeleteCityAdConfigMutation()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CityAdConfiguration | null>(null)
  const [viewing, setViewing] = useState<CityAdConfiguration | null>(null)
  const [toDelete, setToDelete] = useState<CityAdConfiguration | null>(null)

  const columns: Column<CityAdConfiguration>[] = [
    {
      key: 'city',
      header: 'Location',
      render: (row) => {
        const hierarchy = [
          row.country,
          row.province,
          row.city || row.canton,
          row.sector,
          row.neighborhood,
        ]
          .filter(Boolean)
          .join(' › ')

        return (
          <div className="flex items-center gap-3">
            <CityImageThumb src={row.defaultFeaturedImage} alt={row.city || row.canton || 'Location'} />
            <div>
              <p className="font-medium text-ink-900">
                {row.city || row.canton || 'Unnamed Location'}
                {row.sector ? <span className="font-normal text-ink-600"> · {row.sector}</span> : null}
                {row.neighborhood ? (
                  <span className="text-xs font-normal text-ink-400"> ({row.neighborhood})</span>
                ) : null}
              </p>
              <p className="max-w-sm truncate text-xs text-ink-500" title={hierarchy}>
                {hierarchy || row.country}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'featured',
      header: 'Featured channel',
      render: (row) => (
        <ChannelSummary
          enabled={row.featuredEnabled}
          capacity={row.featuredCapacity}
          extra={
            row.featuredPositionPricing.length
              ? `${row.featuredPositionPricing.length} prices`
              : 'No pricing'
          }
        />
      ),
    },
    {
      key: 'pricing',
      header: 'Top slot',
      render: (row) => {
        const first = row.featuredPositionPricing[0]
        return first ? (
          <span className="text-ink-800">{formatCurrency(first.price)}</span>
        ) : (
          <span className="text-ink-300">—</span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={(row.status as EntityStatus) || 'active'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setViewing(row)}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setToDelete(row)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    const displayName = toDelete.city || toDelete.canton || 'location'
    try {
      await deleteConfig(toDelete.id).unwrap()
      toast.success(`Ads configuration for “${displayName}” deleted successfully.`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete configuration.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Ads Configuration"
        description="Manage location-wise featured ad channels, slot capacity, and position pricing across Country › Province › City/Canton › Sector › Neighborhood."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New ads config
          </Button>
        }
      />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by location, city, province…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isFetching}
          onRowClick={(row) => setViewing(row)}
          emptyTitle="No ads configurations"
          emptyDescription="Create a configuration to set featured ad slots for a location."
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      <CityAdConfigDetailsModal
        config={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => {
          if (!viewing) return
          setEditing(viewing)
          setViewing(null)
        }}
      />

      <CityAdConfigFormModal
        open={creating || Boolean(editing)}
        config={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.city || toDelete?.canton || 'location'}” ads configuration?`}
        description="This removes the location’s featured ad channel settings."
        confirmLabel="Delete configuration"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function CityImageThumb({ src, alt }: { src?: string; alt: string }) {
  const url = imageUrl(src)
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100">
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4 text-ink-400" />
      )}
    </div>
  )
}

function ChannelSummary({
  enabled,
  capacity,
  extra,
}: {
  enabled: boolean
  capacity: number
  extra?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Badge tone={enabled ? 'green' : 'gray'}>{enabled ? 'On' : 'Off'}</Badge>
        <span className="text-sm text-ink-800">{capacity} slots</span>
      </div>
      {extra && <p className="mt-0.5 text-xs text-ink-500">{extra}</p>}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-900">{value || '—'}</p>
    </div>
  )
}

function CityAdConfigDetailsModal({
  config,
  onClose,
  onEdit,
}: {
  config: CityAdConfiguration | null
  onClose: () => void
  onEdit: () => void
}) {
  const imageSrc = imageUrl(config?.defaultFeaturedImage)
  const pricing = [...(config?.featuredPositionPricing ?? [])].sort(
    (a, b) => Number(a.position) - Number(b.position),
  )
  const hierarchy = config
    ? [config.country, config.province, config.city || config.canton, config.sector, config.neighborhood]
        .filter(Boolean)
        .join(' › ')
    : ''

  return (
    <Modal
      open={Boolean(config)}
      onClose={onClose}
      title={config ? `${config.city || config.canton} · Ads configuration` : 'Ads configuration'}
      description={hierarchy || 'Featured slot capacity and position pricing for this location.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </>
      }
    >
      {config && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:h-28 sm:w-40">
              {imageSrc ? (
                <img src={imageSrc} alt={config.city || config.canton} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-ink-900">{config.city || config.canton}</h3>
                <StatusBadge status={(config.status as EntityStatus) || 'active'} />
                <Badge tone={config.featuredEnabled ? 'green' : 'gray'}>
                  Featured {config.featuredEnabled ? 'on' : 'off'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <DetailItem label="Country" value={config.country} />
                <DetailItem label="Province" value={config.province || '—'} />
                <DetailItem label="City / Canton" value={config.city || config.canton || '—'} />
                <DetailItem label="Sector" value={config.sector || '—'} />
                <DetailItem label="Neighborhood" value={config.neighborhood || '—'} />
                <DetailItem label="Featured capacity" value={`${config.featuredCapacity} slots`} />
                <DetailItem
                  label="Coordinates"
                  value={
                    config.latitude != null && config.longitude != null
                      ? `${Number(config.latitude).toFixed(4)}, ${Number(config.longitude).toFixed(4)}`
                      : '—'
                  }
                />
                <DetailItem
                  label="Created"
                  value={config.createdAt ? formatDate(config.createdAt) : '—'}
                />
                <DetailItem
                  label="Updated"
                  value={config.updatedAt ? formatDate(config.updatedAt) : '—'}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink-800">Featured position pricing</p>
              <span className="text-xs text-ink-500">{pricing.length} positions</span>
            </div>
            {pricing.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-sm text-ink-500">
                No position prices set for this location.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-ink-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                      <th className="px-4 py-2.5">Position</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((item) => (
                      <tr key={item.position} className="border-b border-ink-50 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-ink-800">Position {item.position}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-ink-900">
                          {formatCurrency(Number(item.price) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

const emptyForm = {
  country: 'Ecuador',
  countryCode: 'EC',
  province: '',
  provinceCode: '',
  city: '',
  cityKey: '',
  canton: '',
  sector: '',
  neighborhood: '',
  latitude: '',
  longitude: '',
  featuredCapacity: '5',
  featuredEnabled: true,
  status: 'active',
  featuredPositionPricing: syncPricing(5),
}

function CityAdConfigFormModal({
  open,
  config,
  onClose,
}: {
  open: boolean
  config: CityAdConfiguration | null
  onClose: () => void
}) {
  const [createConfig, { isLoading: creating }] = useCreateCityAdConfigMutation()
  const [updateConfig, { isLoading: updating }] = useUpdateCityAdConfigMutation()

  const [country, setCountry] = useState(emptyForm.country)
  const [countryCode, setCountryCode] = useState(emptyForm.countryCode)
  const [province, setProvince] = useState(emptyForm.province)
  const [provinceCode, setProvinceCode] = useState(emptyForm.provinceCode)
  const [city, setCity] = useState(emptyForm.city)
  const [cityKey, setCityKey] = useState(emptyForm.cityKey)
  const [canton, setCanton] = useState(emptyForm.canton)
  const [sector, setSector] = useState(emptyForm.sector)
  const [neighborhood, setNeighborhood] = useState(emptyForm.neighborhood)
  const [latitude, setLatitude] = useState(emptyForm.latitude)
  const [longitude, setLongitude] = useState(emptyForm.longitude)
  const [isCustomCity, setIsCustomCity] = useState(false)
  const [featuredCapacity, setFeaturedCapacity] = useState(emptyForm.featuredCapacity)
  const [featuredEnabled, setFeaturedEnabled] = useState(emptyForm.featuredEnabled)
  const [status, setStatus] = useState(emptyForm.status)
  const [pricing, setPricing] = useState<FormPositionPrice[]>(emptyForm.featuredPositionPricing)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [locationReady, setLocationReady] = useState(false)

  const provinces = useMemo(() => {
    return getProvincesByCountry(countryCode)
  }, [countryCode])

  const provinceOptions = useMemo(() => {
    return getProvinceSelectOptions(provinces)
  }, [provinces])

  const cities = useMemo(() => {
    const list = getCitiesByProvince(countryCode, provinceCode)
    const hasSelected =
      Boolean(cityKey) &&
      list.some((item) => item.key === cityKey || item.name.toLowerCase() === city.toLowerCase())
    if (city && !hasSelected && !isCustomCity) {
      return [makeCustomCity(city, latitude || 0, longitude || 0, provinceCode), ...list]
    }
    return list
  }, [countryCode, provinceCode, city, cityKey, latitude, longitude, isCustomCity])

  const cityOptions = useMemo(() => getCitySelectOptions(cities), [cities])

  useEffect(() => {
    if (!open) {
      setLocationReady(false)
      return
    }
    if (config) {
      const matchedCountry = findCountry(config.countryCode || config.country)
      const nextCountryCode = matchedCountry?.isoCode || config.countryCode || ''
      const nextCountry = matchedCountry?.name || config.country || ''
      const matchedProvince = nextCountryCode
        ? findProvince(nextCountryCode, config.provinceCode || config.province || '')
        : undefined
      const nextProvinceCode = matchedProvince?.isoCode || config.provinceCode || ''
      const nextProvince = matchedProvince?.name || config.province || ''
      const targetCityName = config.city || config.canton || ''
      const matchedCity = nextCountryCode
        ? findCity(nextCountryCode, targetCityName, nextProvinceCode)
        : undefined
      const capacity = config.featuredCapacity || config.featuredPositionPricing.length || 0

      setCountry(nextCountry)
      setCountryCode(nextCountryCode)
      setProvince(nextProvince)
      setProvinceCode(nextProvinceCode)
      setCity(targetCityName)
      setCanton(config.canton || targetCityName)
      setSector(config.sector || '')
      setNeighborhood(config.neighborhood || '')

      if (matchedCity) {
        setCity(matchedCity.name)
        setCityKey(matchedCity.key)
        setIsCustomCity(false)
      } else if (targetCityName) {
        const custom = makeCustomCity(
          targetCityName,
          config.latitude ?? 0,
          config.longitude ?? 0,
          nextProvinceCode,
        )
        setCity(targetCityName)
        setCityKey(custom.key)
        setIsCustomCity(true)
      } else {
        setCity('')
        setCityKey('')
        setIsCustomCity(false)
      }

      setLatitude(config.latitude != null ? String(config.latitude) : '')
      setLongitude(config.longitude != null ? String(config.longitude) : '')
      setFeaturedCapacity(String(capacity))
      setFeaturedEnabled(Boolean(config.featuredEnabled))
      setStatus(config.status || 'active')
      setPricing(syncPricing(capacity, config.featuredPositionPricing))
      setImageFile(null)
      setPreviewUrl(imageUrl(config.defaultFeaturedImage) || '')
    } else {
      setCountry(emptyForm.country)
      setCountryCode(emptyForm.countryCode)
      setProvince(emptyForm.province)
      setProvinceCode(emptyForm.provinceCode)
      setCity(emptyForm.city)
      setCityKey(emptyForm.cityKey)
      setCanton(emptyForm.canton)
      setSector(emptyForm.sector)
      setNeighborhood(emptyForm.neighborhood)
      setLatitude(emptyForm.latitude)
      setLongitude(emptyForm.longitude)
      setIsCustomCity(false)
      setFeaturedCapacity(emptyForm.featuredCapacity)
      setFeaturedEnabled(emptyForm.featuredEnabled)
      setStatus(emptyForm.status)
      setPricing(syncPricing(5))
      setImageFile(null)
      setPreviewUrl('')
    }
    setLocationReady(true)
  }, [open, config])

  const handleCountryChange = (isoCode: string) => {
    const selected = findCountry(isoCode)
    setCountryCode(isoCode)
    setCountry(selected?.name || '')
    setProvince('')
    setProvinceCode('')
    setCity('')
    setCityKey('')
    setCanton('')
    setSector('')
    setNeighborhood('')
    setLatitude('')
    setLongitude('')
    setIsCustomCity(false)
  }

  const handleProvinceChange = (isoCode: string) => {
    const selected = provinces.find((p) => p.isoCode === isoCode)
    setProvinceCode(isoCode)
    setProvince(selected?.name || '')
    setCity('')
    setCityKey('')
    setCanton('')
    setSector('')
    setNeighborhood('')
    setIsCustomCity(false)
    if (selected?.latitude && selected?.longitude) {
      setLatitude(selected.latitude)
      setLongitude(selected.longitude)
    } else {
      setLatitude('')
      setLongitude('')
    }
  }

  const handleCityChange = (key: string) => {
    const selected = cities.find((item) => item.key === key)
    if (!selected) {
      setCity('')
      setCityKey('')
      setCanton('')
      setLatitude('')
      setLongitude('')
      return
    }
    setCityKey(selected.key)
    setCity(selected.name)
    setCanton(selected.name)
    setLatitude(selected.latitude)
    setLongitude(selected.longitude)
  }

  const handleCapacityChange = (value: string) => {
    setFeaturedCapacity(value)
    const n = Number(value)
    if (!Number.isNaN(n) && n >= 0 && n <= 50) {
      setPricing((current) => syncPricing(n, current))
    }
  }

  const handlePriceChange = (index: number, value: string) => {
    setPricing((current) =>
      current.map((item, i) => (i === index ? { ...item, price: value } : item)),
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!countryCode || !country) {
      toast.error('Select a country.')
      return
    }
    if (provinceOptions.length > 0 && !province) {
      toast.error('Select a province.')
      return
    }
    if (!city.trim()) {
      toast.error('Select or enter a city / canton.')
      return
    }
    if (
      latitude === '' ||
      longitude === '' ||
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      toast.error('Coordinates (latitude and longitude) are required. Select a location or enter coordinates.')
      return
    }

    const finalCity = city.trim()
    const finalCanton = (canton || city).trim()

    const payload: CityAdConfigInput = {
      country: country.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      province: province.trim(),
      provinceCode: provinceCode.trim().toUpperCase(),
      city: finalCity,
      canton: finalCanton,
      sector: sector.trim(),
      neighborhood: neighborhood.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      featuredCapacity: Number(featuredCapacity) || 0,
      featuredEnabled,
      featuredPositionPricing: toPayloadPricing(syncPricing(Number(featuredCapacity) || 0, pricing)),
      status,
      defaultFeaturedImageFile: imageFile,
    }

    try {
      if (config) {
        await updateConfig({ id: config.id, ...payload }).unwrap()
        toast.success(`Ads configuration for “${payload.city}” updated successfully.`)
      } else {
        await createConfig(payload).unwrap()
        toast.success(`Ads configuration for “${payload.city}” created successfully.`)
      }
      onClose()
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save configuration. Please check details and try again.',
      )
    }
  }

  const saving = creating || updating
  const currentTitle = config ? config.city || config.canton : 'New'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config ? `Edit · ${currentTitle}` : 'New ads configuration'}
      description="Configure location hierarchy: Country › Province › City/Canton › Sector › Neighborhood. Coordinates are shown on the map."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="city-ad-config-form" loading={saving}>
            {config ? 'Save changes' : 'Create configuration'}
          </Button>
        </>
      }
    >
      <form id="city-ad-config-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <span className={country ? 'font-bold text-brand-600' : ''}>Country</span>
            <span>›</span>
            <span className={province ? 'font-bold text-brand-600' : ''}>Province</span>
            <span>›</span>
            <span className={city ? 'font-bold text-brand-600' : ''}>City / Canton</span>
            <span>›</span>
            <span className={sector ? 'font-bold text-brand-600' : ''}>Sector</span>
            <span>›</span>
            <span className={neighborhood ? 'font-bold text-brand-600' : ''}>Neighborhood</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Country"
              options={COUNTRY_OPTIONS}
              placeholder="Select country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              required
            />
            <Select
              label="Province"
              options={provinceOptions}
              placeholder={countryCode ? 'Select province' : 'Select a country first'}
              value={provinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={!countryCode || provinceOptions.length === 0}
              required={provinceOptions.length > 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isCustomCity || cityOptions.length === 0 ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-ink-700">City / Canton</label>
                  {cityOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCity(false)
                        setCity('')
                        setCityKey('')
                        setCanton('')
                      }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Choose from list
                    </button>
                  )}
                </div>
                <Input
                  placeholder="e.g. Quito, Guayaquil, Cuenca"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setCanton(e.target.value)
                  }}
                  disabled={!countryCode}
                  required
                />
              </div>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-ink-700">City / Canton</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCity(true)
                      setCity('')
                      setCityKey('__custom__')
                      setCanton('')
                    }}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    + Custom city/canton
                  </button>
                </div>
                <Select
                  options={cityOptions}
                  placeholder={provinceCode ? 'Select city / canton' : 'Select a province first'}
                  value={cityKey}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!provinceCode}
                  required
                />
              </div>
            )}

            <Input
              label="Sector (Optional)"
              placeholder="e.g. Norte, Centro, Cumbayá"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={!countryCode}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Neighborhood (Optional)"
              placeholder="e.g. Barrio San Juan, Bellavista"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              disabled={!countryCode}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="e.g. -0.1807"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="e.g. -78.4678"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {locationReady && <GoogleLocationMap active={open} latitude={latitude} longitude={longitude} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-100 p-4">
            <p className="mb-3 text-sm font-medium text-ink-800">Featured channel</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2">
                <p className="mb-1.5 text-sm font-medium text-ink-700">Enabled</p>
                <label className="flex h-10 items-center gap-2 text-sm text-ink-700">
                  <Switch
                    checked={featuredEnabled}
                    onChange={setFeaturedEnabled}
                    label="Featured enabled"
                  />
                  {featuredEnabled ? 'On' : 'Off'}
                </label>
              </div>
              <Input
                label="Featured capacity"
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 5"
                value={featuredCapacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-ink-100 p-4">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Default featured image</label>
            <div className="flex h-[calc(100%-1.5rem)] min-h-[8.5rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 p-3 text-center transition-colors hover:border-brand-500">
              {previewUrl ? (
                <div className="relative mb-2 h-24 w-full overflow-hidden rounded-md border border-ink-200">
                  <img src={previewUrl} alt="Featured preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-1 text-ink-500">
                  <Upload className="mb-1 h-6 w-6 text-ink-400" />
                  <span className="text-xs font-medium">Upload image</span>
                  <span className="text-[11px] text-ink-400">PNG, JPG, WEBP</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full cursor-pointer text-xs text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>
          </div>
        </div>

        {config && (
          <div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <Switch
                checked={status === 'active'}
                onChange={(active) => setStatus(active ? 'active' : 'inactive')}
                label="Active"
              />
            </label>
          </div>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">Featured position pricing</p>
            <span className="text-xs text-ink-500">{pricing.length} positions</span>
          </div>
          {pricing.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-sm text-ink-500">
              Set featured capacity to add position prices.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pricing.map((item, index) => (
                <Input
                  key={item.position}
                  label={`Position ${item.position}`}
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 25"
                  value={item.price !== undefined && item.price !== null ? String(item.price) : ''}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  required
                />
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
