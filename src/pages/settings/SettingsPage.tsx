import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Check, Lock, ShieldCheck, Trash2, UserCog, Phone } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/store/hooks'
import { updateProfile as updateProfileRedux } from '@/components/auth/authSlice'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/services/endpoints/authApi'
import type { Option } from '@/types/common.types'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

const GENDER_OPTIONS: Option[] = [
  { label: 'Select gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading: loadingProfile } = useGetProfileQuery()
  const [updateProfileApi, { isLoading: savingProfile }] = useUpdateProfileMutation()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const activeData = profile || user
    if (activeData) {
      setName(activeData.name || '')
      setPhone(activeData.phone || '')
      setGender(activeData.gender || '')
      if (!selectedFile) {
        setAvatarPreview(activeData.avatarUrl)
      }
    }
  }, [profile, user, selectedFile])

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file.')
    if (file.size > MAX_AVATAR_BYTES) return setPhotoError('Image must be under 2 MB.')

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setAvatarPreview(objectUrl)
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    setAvatarPreview(undefined)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await updateProfileApi({
        name,
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        profileImage: selectedFile || undefined,
      }).unwrap()

      setSelectedFile(null)
      dispatch(
        updateProfileRedux({
          name: res.data.name,
          avatarUrl: res.data.avatarUrl ?? null,
        }),
      )
      toast.success('Profile updated successfully!')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update profile.')
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration and your admin profile." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-3">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-brand-600" /> Admin profile
              </span>
            }
            description="Your account information and photo."
          />
          <CardBody>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4 rounded-xl bg-ink-50 p-5 sm:flex-row sm:items-center">
                <div className="group relative h-20 w-20 shrink-0">
                  <Avatar name={name || 'Admin'} src={avatarPreview} size="lg" className="h-20 w-20 text-2xl" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/55 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Change photo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-ink-900">Profile photo</p>
                  <p className="mt-0.5 text-xs text-ink-500">PNG or JPG, up to 2 MB.</p>
                  <div className="mt-2 flex justify-center gap-2 sm:justify-start">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Camera className="h-3.5 w-3.5" /> Change
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={handleRemovePhoto}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                  {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={loadingProfile}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  leftIcon={<Lock className="h-4 w-4" />}
                  hint="Admin email can’t be changed."
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  leftIcon={<Phone className="h-4 w-4" />}
                  disabled={loadingProfile}
                />
                <Select
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>

              <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
                <Button type="submit" loading={savingProfile}>
                  Save changes
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-sm text-brand-600">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Change password */}
        <Card className="lg:col-span-3">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Change password
              </span>
            }
            description="Update the password used to sign in."
          />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function ChangePasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) return setError('New password must be at least 6 characters.')
    if (newPassword !== confirm) return setError('New password and confirmation don’t match.')

    try {
      await changePassword({ currentPassword, newPassword }).unwrap()
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Could not change password.'
      setError(errMsg)
      toast.error(errMsg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-600/20">{error}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isLoading}>
          Update password
        </Button>
      </div>
    </form>
  )
}
