"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Gavel,
  LayoutDashboard,
  ShieldCheck,
  ShieldEllipsis,
  Shirt,
  Sparkles,
} from "lucide-react"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const NAVIGATION = [
  {
    title: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Registry",
    items: [
      { href: "/admin/artifacts", label: "Artifacts", icon: Shirt },
      { href: "/admin/events", label: "Provenance Events", icon: Sparkles },
      { href: "/admin/authentications", label: "Authentications", icon: ShieldCheck },
    ],
  },
  {
    title: "Commerce",
    items: [{ href: "/admin/auctions", label: "Auctions", icon: Gavel }],
  },
  {
    title: "Assets",
    items: [
      { href: "/admin/media/upload", label: "Media Upload", icon: Camera },
      { href: "/admin/disclosure", label: "Disclosure Control", icon: ShieldEllipsis },
    ],
  },
] as const

function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true
  }

  return pathname.startsWith(`${href}/`)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, isConfigured, error } = useSupabaseSession()
  const allowedEmails = (process.env.NEXT_PUBLIC_KRUNCH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const isAllowed = !allowedEmails.length || allowedEmails.includes(user?.email?.toLowerCase() ?? "")

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#05070c] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Admin unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Supabase is not configured for this local environment.</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Add the Krunch Supabase URL and publishable key to `.env.local` so the admin console can load the live provenance tables.
          </p>
          {error ? <p className="mt-4 rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070c] px-4 py-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 lg:flex-row">
          <div className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-6 lg:w-72">
            <Skeleton className="h-6 w-24 bg-white/10" />
            <Skeleton className="mt-5 h-10 w-full bg-white/10" />
            <Skeleton className="mt-2 h-10 w-full bg-white/10" />
            <Skeleton className="mt-2 h-10 w-full bg-white/10" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-28 w-full bg-white/10" />
            <Skeleton className="h-[60vh] w-full bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#05070c] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Krunch Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to access the provenance console.</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            The admin routes use the same Supabase authentication flow as the public app. Sign in first, then come back here to manage artifacts and related records.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/login">Go to login</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/">
                Back to storefront
                <ArrowUpRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#05070c] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-500/25 bg-amber-500/10 p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-100/70">Access restricted</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-amber-50">Your account is signed in, but not on the admin allowlist.</h1>
          <p className="mt-3 text-sm leading-6 text-amber-100/75">
            Add this email address to `NEXT_PUBLIC_KRUNCH_ADMIN_EMAILS` if this account should manage provenance data.
          </p>
          <p className="mt-4 text-sm text-amber-50">{user.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:gap-8">
        <aside className="top-4 h-fit rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:w-72 lg:self-start">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md border border-[#FF6B9D]/30 bg-[#FF6B9D]/10 text-[#FF6B9D]">
                <BadgeCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Krunch Admin</p>
                <p className="text-sm font-medium text-white">Provenance Operations</p>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Signed in as</p>
              <p className="mt-1 truncate text-sm text-white/80">{user.email}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-6">
            {NAVIGATION.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname ? isNavItemActive(pathname, item.href) : false

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "border-[#FF6B9D]/30 bg-[#FF6B9D]/12 text-white"
                            : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                        )}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
