import { Briefcase, KeyRound, type LucideIcon, UserRound } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AvatarCropDialog } from '@/components/AvatarCropDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserAvatar } from '@/components/UserAvatar'
import { useCan } from '@/hooks/usePermissions'
import { usePositions } from '@/hooks/usePositions'
import { useDeleteAvatar, useUpdatePassword, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { useRoles } from '@/hooks/useRoles'
import { useUpdateUser, useUser } from '@/hooks/useUsers'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex gap-3 md:flex-col md:gap-2">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
      </Card>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
  wide,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`flex flex-col gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = useCan('users.manage')
  // Grants read-only browsing of the directory and everyone's profile page
  // (e.g. HR) — editing stays gated to isAdmin below, field by field.
  const canViewAll = useCan('users.view-all')
  const canBrowseAnyone = isAdmin || canViewAll
  const isSelf = currentUser?.id === userId

  const { data: user, isLoading } = useUser(userId)
  const { data: positions } = usePositions()
  const { data: roles } = useRoles()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [positionId, setPositionId] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [phone, setPhone] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateUser = useUpdateUser()
  const updateProfile = useUpdateProfile()
  const updatePassword = useUpdatePassword()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPositionId(String(user.position_id))
      setRole(user.roles?.[0]?.name ?? '')
      setStatus(user.status)
      setPhone(user.phone ?? '')
      setEmployeeCode(user.employee_code ?? '')
      setHireDate(user.hire_date ?? '')
    }
  }, [user])

  useEffect(() => {
    // Only an admin or a view-all holder (e.g. HR) can browse anyone's
    // page — everyone else only ever lands on their own.
    if (currentUser && !canBrowseAnyone && !isSelf) {
      navigate(`/users/${currentUser.id}`, { replace: true })
    }
  }, [currentUser, canBrowseAnyone, isSelf, navigate])

  if (isLoading || !user || (!canBrowseAnyone && !isSelf)) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  const handleSaveDetails = () => {
    if (isAdmin) {
      updateUser.mutate(
        {
          id: user.id,
          payload: {
            name,
            email,
            position_id: Number(positionId),
            role,
            status,
            phone,
            employee_code: employeeCode || null,
            hire_date: hireDate || null,
          },
        },
        {
          onSuccess: () => toast.success('User updated'),
          onError: (error) => toast.error(errorMessage(error)),
        },
      )
    } else {
      updateProfile.mutate(
        { phone },
        {
          onSuccess: () => toast.success('Profile updated'),
          onError: (error) => toast.error(errorMessage(error)),
        },
      )
    }
  }

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setPendingAvatarFile(file)
  }

  const handleCroppedAvatar = (file: File) => {
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success('Profile picture updated'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const handleRemoveAvatar = () => {
    deleteAvatar.mutate(undefined, {
      onSuccess: () => toast.success('Profile picture removed'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const handleChangePassword = () => {
    updatePassword.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success('Password updated')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const roleName = user.roles?.[0]?.name
  const positionName = positions?.find((p) => String(p.id) === positionId)?.name

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {canBrowseAnyone && !isSelf && (
        <Button variant="ghost" size="sm" className="-mb-4 -ml-2 self-start" onClick={() => navigate('/users')}>
          ← Back to Users
        </Button>
      )}

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="bg-primary/10 h-24" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="ring-card w-fit rounded-full ring-4">
              <UserAvatar name={user.name} url={user.avatar_url} size="lg" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {isSelf ? 'My Profile' : user.name}
              </h1>
              <p className="text-muted-foreground text-sm">{[positionName, user.email].filter(Boolean).join(' · ')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleName && <Badge variant="secondary">{roleName}</Badge>}
                <Badge variant="outline" className="capitalize">
                  {status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSelf && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadAvatar.isPending}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {uploadAvatar.isPending ? 'Uploading…' : user.avatar_url ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {user.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deleteAvatar.isPending}
                    onClick={handleRemoveAvatar}
                  >
                    Remove
                  </Button>
                )}
              </>
            )}
            {(isAdmin || isSelf) && (
              <Button size="sm" onClick={handleSaveDetails} disabled={updateUser.isPending || updateProfile.isPending}>
                {updateUser.isPending || updateProfile.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AvatarCropDialog
        file={pendingAvatarFile}
        onOpenChange={(open) => !open && setPendingAvatarFile(null)}
        onCropped={handleCroppedAvatar}
      />

      <Section icon={UserRound} title="Personal information" description="Name and ways to reach this person.">
        <Field label="Name" htmlFor="name">
          <Input id="name" disabled={!isAdmin} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" disabled={!isAdmin} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            autoComplete="tel"
            disabled={!isAdmin && !isSelf}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
      </Section>

      <Section icon={Briefcase} title="Employment" description="Position, access level and status within the company.">
        <Field label="Position" htmlFor="position">
          <Select value={positionId} onValueChange={setPositionId} disabled={!isAdmin}>
            <SelectTrigger id="position" className="w-full">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {positions?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Role" htmlFor="role">
          <Select value={role} onValueChange={setRole} disabled={!isAdmin}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')} disabled={!isAdmin}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="User ID" htmlFor="employee_code">
          <Input
            id="employee_code"
            disabled={!isAdmin}
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
          />
        </Field>
        <Field label="Hire date" htmlFor="hire_date" wide>
          <Input
            id="hire_date"
            type="date"
            disabled={!isAdmin}
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {isAdmin ? 'Administrator-only.' : 'Set by your administrator — contact HR to change it.'}
          </p>
        </Field>
      </Section>

      {isSelf && (
        <Section icon={KeyRound} title="Security" description="Change the password you use to sign in.">
          <Field label="Current password" htmlFor="current_password" wide>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password" htmlFor="new_password">
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm_password">
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <Button
            size="sm"
            className="self-start sm:col-span-2"
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || updatePassword.isPending}
          >
            {updatePassword.isPending ? 'Updating…' : 'Update Password'}
          </Button>
        </Section>
      )}
    </div>
  )
}
