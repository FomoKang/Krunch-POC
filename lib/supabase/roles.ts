import type { PostgrestError } from "@supabase/supabase-js"
import type { KrunchRole, ManageableKrunchRole } from "@/lib/admin/constants"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type RoleProfileRecord = {
  id: string
  email: string
  nickname: string
  created_at: string
}

export type UserRoleRecord = {
  user_id: string
  role: KrunchRole
  assigned_by: string | null
  created_at: string
  updated_at: string
}

export type RoleAssignmentRecord = UserRoleRecord & {
  user_profile: RoleProfileRecord | null
  assigned_by_profile: RoleProfileRecord | null
}

function getRoleErrorMessage(error: PostgrestError | Error | unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown role error."

  if (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("user_roles")
  ) {
    return "The role system is not installed yet. Run the role-based RLS migration and the super admin bootstrap SQL first."
  }

  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "Your account does not have permission to manage internal roles."
  }

  return message
}

export async function listUserRoles(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, assigned_by, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(getRoleErrorMessage(error))
  }

  return (data ?? []) as UserRoleRecord[]
}

export async function listRoleProfiles() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nickname, created_at")
    .order("email", { ascending: true })

  if (error) {
    throw new Error(getRoleErrorMessage(error))
  }

  return (data ?? []) as RoleProfileRecord[]
}

export async function listRoleAssignments() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, assigned_by, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(getRoleErrorMessage(error))
  }

  const assignments = (data ?? []) as UserRoleRecord[]
  const profileIds = Array.from(
    new Set(
      assignments
        .flatMap((assignment) => [assignment.user_id, assignment.assigned_by])
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (!profileIds.length) {
    return assignments.map((assignment) => ({
      ...assignment,
      user_profile: null,
      assigned_by_profile: null,
    })) as RoleAssignmentRecord[]
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, nickname, created_at")
    .in("id", profileIds)

  if (profilesError) {
    throw new Error(getRoleErrorMessage(profilesError))
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as RoleProfileRecord]))

  return assignments.map((assignment) => ({
    ...assignment,
    user_profile: profileMap.get(assignment.user_id) ?? null,
    assigned_by_profile: assignment.assigned_by ? profileMap.get(assignment.assigned_by) ?? null : null,
  })) as RoleAssignmentRecord[]
}

export async function assignUserRole(input: {
  userId: string
  role: ManageableKrunchRole
  assignedBy?: string | null
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: input.userId,
        role: input.role,
        assigned_by: input.assignedBy ?? null,
      },
      { onConflict: "user_id,role" },
    )
    .select("user_id, role, assigned_by, created_at, updated_at")
    .single()

  if (error) {
    throw new Error(getRoleErrorMessage(error))
  }

  return data as UserRoleRecord
}

export async function revokeUserRole(userId: string, role: ManageableKrunchRole) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role)

  if (error) {
    throw new Error(getRoleErrorMessage(error))
  }
}
