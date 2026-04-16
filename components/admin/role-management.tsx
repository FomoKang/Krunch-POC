"use client"

import { useEffect, useMemo, useState } from "react"
import { KeyRound, ShieldAlert, UserPlus, Users } from "lucide-react"
import { useAdminAccess } from "@/hooks/use-admin-access"
import { toast } from "@/hooks/use-toast"
import {
  MANAGEABLE_KRUNCH_ROLE_OPTIONS,
  type ManageableKrunchRole,
} from "@/lib/admin/constants"
import {
  assignUserRole,
  listRoleAssignments,
  listRoleProfiles,
  revokeUserRole,
  type RoleAssignmentRecord,
  type RoleProfileRecord,
} from "@/lib/supabase/roles"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type GroupedAssignment = {
  userId: string
  profile: RoleProfileRecord | null
  assignments: RoleAssignmentRecord[]
}

function formatAssignedBy(record: RoleAssignmentRecord) {
  if (record.assigned_by_profile?.email) {
    return record.assigned_by_profile.email
  }

  if (record.assigned_by === record.user_id && record.role === "super_admin") {
    return "Bootstrap SQL"
  }

  return "-"
}

export function RoleManagement() {
  const { user, accessLoading, rolesError, isSuperAdmin } = useAdminAccess()
  const [profiles, setProfiles] = useState<RoleProfileRecord[]>([])
  const [assignments, setAssignments] = useState<RoleAssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<ManageableKrunchRole>("admin")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accessLoading) {
      return
    }

    if (!user || !isSuperAdmin) {
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      try {
        setLoading(true)
        const [nextProfiles, nextAssignments] = await Promise.all([
          listRoleProfiles(),
          listRoleAssignments(),
        ])

        if (!active) {
          return
        }

        setProfiles(nextProfiles)
        setAssignments(nextAssignments)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load role assignments.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [accessLoading, isSuperAdmin, user])

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return profiles
    }

    return profiles.filter((profile) => {
      const haystack = [profile.email, profile.nickname].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(query)
    })
  }, [profiles, search])

  const groupedAssignments = useMemo<GroupedAssignment[]>(() => {
    const grouped = new Map<string, GroupedAssignment>()

    for (const assignment of assignments) {
      const existing = grouped.get(assignment.user_id)

      if (existing) {
        existing.assignments.push(assignment)
        continue
      }

      grouped.set(assignment.user_id, {
        userId: assignment.user_id,
        profile: assignment.user_profile,
        assignments: [assignment],
      })
    }

    return Array.from(grouped.values()).sort((left, right) => {
      const leftEmail = left.profile?.email ?? ""
      const rightEmail = right.profile?.email ?? ""
      return leftEmail.localeCompare(rightEmail)
    })
  }, [assignments])

  const selectedUserAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.user_id === selectedUserId),
    [assignments, selectedUserId],
  )
  const selectedUserAlreadyHasRole = selectedUserAssignments.some((assignment) => assignment.role === selectedRole)
  const superAdminCount = assignments.filter((assignment) => assignment.role === "super_admin").length

  async function refreshRoleData() {
    const [nextProfiles, nextAssignments] = await Promise.all([
      listRoleProfiles(),
      listRoleAssignments(),
    ])

    setProfiles(nextProfiles)
    setAssignments(nextAssignments)
  }

  async function handleAssignRole() {
    if (!user) {
      return
    }

    if (!selectedUserId) {
      toast({
        title: "Select a user",
        description: "Choose which account should receive the internal role.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      await assignUserRole({
        userId: selectedUserId,
        role: selectedRole,
        assignedBy: user.id,
      })
      await refreshRoleData()

      toast({
        title: "Role granted",
        description: `${selectedRole} is now active for the selected account.`,
      })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to assign the role."
      setError(message)
      toast({
        title: "Grant failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleRevokeRole(record: RoleAssignmentRecord) {
    if (!user) {
      return
    }

    if (record.role === "super_admin" && superAdminCount <= 1) {
      toast({
        title: "At least one super admin is required",
        description: "Grant another super_admin before removing the final one.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      await revokeUserRole(record.user_id, record.role)
      await refreshRoleData()

      toast({
        title: "Role removed",
        description: `${record.role} access has been revoked.`,
      })
    } catch (revokeError) {
      const message = revokeError instanceof Error ? revokeError.message : "Unable to revoke the role."
      setError(message)
      toast({
        title: "Revoke failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (accessLoading || loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="System" title="Access Control" description="Manage internal Krunch roles for the admin console." />
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Skeleton className="h-[420px] w-full bg-white/10" />
          <Skeleton className="h-[420px] w-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (rolesError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="System" title="Access Control" description="Manage internal Krunch roles for the admin console." />
        <Card className="border-rose-500/25 bg-rose-500/10 text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 text-rose-200" />
              <div>
                <p className="text-lg font-semibold text-rose-50">Role system unavailable</p>
                <p className="mt-2 text-sm leading-6 text-rose-100/85">{rolesError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="System" title="Access Control" description="Manage internal Krunch roles for the admin console." />
        <Card className="border-amber-500/25 bg-amber-500/10 text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 text-amber-200" />
              <div>
                <p className="text-lg font-semibold text-amber-50">Super admin access required</p>
                <p className="mt-2 text-sm leading-6 text-amber-100/80">
                  Only `super_admin` accounts can grant or revoke internal roles. Your current account can still use the areas already allowed by its existing role set.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Access Control"
        description="Grant internal roles deliberately. Every authenticated account stays a plain user until a super admin promotes it here."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Grant internal role</CardTitle>
            <p className="mt-1 text-sm leading-6 text-white/55">
              `user` is implicit. Use this panel only for elevated internal roles such as admin, ops, inspection, finance, or super admin.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Find account</p>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by email or nickname..."
                className="border-white/10 bg-black/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Account</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                  {filteredProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Role</p>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as ManageableKrunchRole)}>
                <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                  {MANAGEABLE_KRUNCH_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserAssignments.length ? (
              <div className="rounded-md border border-white/10 bg-black/25 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Existing roles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUserAssignments.map((assignment) => (
                    <StatusBadge key={`${assignment.user_id}-${assignment.role}`} value={assignment.role} />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={() => void handleAssignRole()}
              disabled={saving || !selectedUserId || selectedUserAlreadyHasRole}
              className="w-full bg-[#FF6B9D] text-black hover:bg-[#ff86b0]"
            >
              <UserPlus className="mr-2 size-4" />
              {selectedUserAlreadyHasRole ? "Role Already Assigned" : "Grant Role"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Current assignments</CardTitle>
            <p className="mt-1 text-sm leading-6 text-white/55">
              Only explicit internal roles are listed here. Every signed-in account still keeps the base `user` role automatically.
            </p>
          </CardHeader>
          <CardContent>
            {groupedAssignments.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/55">Account</TableHead>
                    <TableHead className="text-white/55">Roles</TableHead>
                    <TableHead className="text-white/55">Assigned by</TableHead>
                    <TableHead className="text-right text-white/55">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedAssignments.map((group) => (
                    <TableRow key={group.userId} className="border-white/10">
                      <TableCell className="align-top">
                        <div>
                          <p className="font-medium text-white">{group.profile?.email ?? group.userId}</p>
                          <p className="mt-1 text-xs text-white/45">{group.profile?.nickname ?? "No nickname"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          {group.assignments.map((assignment) => (
                            <StatusBadge key={`${assignment.user_id}-${assignment.role}`} value={assignment.role} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          {group.assignments.map((assignment) => (
                            <p key={`${assignment.user_id}-${assignment.role}-by`} className="text-sm text-white/65">
                              {assignment.role}: {formatAssignedBy(assignment)}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                          {group.assignments.map((assignment) => {
                            const isLastSuperAdmin = assignment.role === "super_admin" && superAdminCount <= 1

                            return (
                              <Button
                                key={`${assignment.user_id}-${assignment.role}-remove`}
                                type="button"
                                variant="outline"
                                className="border-white/10 bg-black/25 text-white hover:bg-black/35"
                                onClick={() => void handleRevokeRole(assignment)}
                                disabled={saving || isLastSuperAdmin}
                              >
                                Remove {assignment.role}
                              </Button>
                            )
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Users}
                title="No internal roles assigned"
                description="Run the bootstrap SQL for the first super admin, then start granting explicit internal roles here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
