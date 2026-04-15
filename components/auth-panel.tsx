"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { upsertProfileFromUser } from "@/lib/supabase/profiles"

type AuthMode = "login" | "signup"

type AuthCopy = {
  continueCta: string
  description: string
  email: string
  loginSuccess: string
  missingConfig: string
  nickname: string
  nicknameRequired: string
  password: string
  passwordMismatch: string
  redirecting: string
  registeredNotice: string
  sessionReady: string
  submit: string
  success: string
  switchAction: string
  switchPrompt: string
  title: string
}

function getCopy(mode: AuthMode): AuthCopy {
  if (mode === "login") {
    return {
      continueCta: "Continue",
      description: "Sign in with email and password, then load the rest of your account from the profiles table.",
      email: "Email",
      loginSuccess: "Signed in. Redirecting now.",
      missingConfig: "Supabase environment variables are missing.",
      nickname: "Nickname",
      nicknameRequired: "Please enter a nickname.",
      password: "Password",
      passwordMismatch: "Passwords do not match.",
      redirecting: "You already have an active session. Redirecting now.",
      registeredNotice: "Your account was created. If email confirmation is enabled, verify your email before logging in.",
      sessionReady: "You already have an active session.",
      submit: "Log in",
      success: "Signed in. Redirecting now.",
      switchAction: "Sign up",
      switchPrompt: "Need an account?",
      title: "Log in",
    }
  }

  return {
    continueCta: "Continue",
    description: "Sign-up starts with a simple flow: create an auth account, then store nickname and email in profiles.",
    email: "Email",
    loginSuccess: "Signed in. Redirecting now.",
    missingConfig: "Supabase environment variables are missing.",
    nickname: "Nickname",
    nicknameRequired: "Please enter a nickname.",
    password: "Password",
    passwordMismatch: "Passwords do not match.",
    redirecting: "You already have an active session. Redirecting now.",
    registeredNotice: "Your account was created. If email confirmation is enabled, verify your email before logging in.",
    sessionReady: "You are already signed in.",
    submit: "Sign up",
    success: "Sign-up request complete.",
    switchAction: "Log in",
    switchPrompt: "Already have an account?",
    title: "Sign up",
  }
}

function getSafeReturnTo(basePath: string, requested: string | null) {
  if (requested && requested.startsWith("/")) {
    return requested
  }

  return `${basePath}/profile`
}

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useSiteTheme()
  const { user, loading, isConfigured } = useSupabaseSession()
  const isBlack = theme === "black"
  const basePath = isBlack ? "/black" : ""
  const copy = useMemo(() => getCopy(mode), [mode])
  const returnTo = getSafeReturnTo(basePath, searchParams.get("returnTo"))

  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user && mode === "login") {
      router.replace(returnTo)
    }
  }, [loading, mode, returnTo, router, user])

  useEffect(() => {
    if (mode !== "login") {
      return
    }

    const prefetchedEmail = searchParams.get("email")
    const registered = searchParams.get("registered") === "1"

    if (prefetchedEmail) {
      setEmail(prefetchedEmail)
    }

    if (registered) {
      setMessage(copy.registeredNotice)
    }
  }, [copy.registeredNotice, mode, searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!isConfigured) {
      setError(copy.missingConfig)
      return
    }

    const cleanEmail = email.trim()
    const cleanNickname = nickname.trim()

    if (mode === "signup" && !cleanNickname) {
      setError(copy.nicknameRequired)
      return
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError(copy.passwordMismatch)
      return
    }

    try {
      setPending(true)
      const supabase = getSupabaseBrowserClient()

      if (mode === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (signInError) {
          throw signInError
        }

        if (data.user) {
          await upsertProfileFromUser(data.user)
        }

        setMessage(copy.loginSuccess)
        router.replace(returnTo)
        router.refresh()
        return
      }

      const emailRedirectTo =
        typeof window === "undefined" ? undefined : `${window.location.origin}${returnTo}`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            nickname: cleanNickname,
          },
          emailRedirectTo,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user && data.session) {
        await upsertProfileFromUser(data.user, cleanNickname)
        setMessage(copy.success)
        router.replace(returnTo)
        router.refresh()
        return
      }

      router.replace(
        `${basePath}/login?registered=1&email=${encodeURIComponent(cleanEmail)}&returnTo=${encodeURIComponent(returnTo)}`,
      )
      router.refresh()
    } catch (submitError) {
      const nextError = submitError instanceof Error ? submitError.message : "Authentication failed."
      setError(nextError)
    } finally {
      setPending(false)
    }
  }

  if (!loading && user && mode === "login") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-white/15 bg-[#0d0d0d] p-6 text-white shadow-[0_16px_52px_rgba(0,0,0,0.42)]">
          <p className={`text-xs uppercase tracking-[0.22em] ${isBlack ? "text-white/45" : "text-[#ff9ebe]"}`}>
            Supabase Auth
          </p>
          <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-white">{copy.redirecting}</h1>
          <p className="mt-3 text-sm text-white/60">{user.email}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/70">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Please wait a moment.</span>
          </div>
        </div>
      </div>
    )
  }

  if (!loading && user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-white/15 bg-[#0d0d0d] p-6 text-white shadow-[0_16px_52px_rgba(0,0,0,0.42)]">
          <p className={`text-xs uppercase tracking-[0.22em] ${isBlack ? "text-white/45" : "text-[#ff9ebe]"}`}>
            Supabase Auth
          </p>
          <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-white">{copy.sessionReady}</h1>
          <p className="mt-3 text-sm text-white/60">{user.email}</p>
          <Button asChild className="mt-6 h-11 w-full bg-[#FF6B9D] text-black hover:bg-[#ff8bb2]">
            <Link href={returnTo}>{copy.continueCta}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center justify-center py-8">
      <div className="w-full rounded-2xl border border-white/15 bg-[#0d0d0d] p-6 text-white shadow-[0_16px_52px_rgba(0,0,0,0.42)]">
        <p className={`text-xs uppercase tracking-[0.22em] ${isBlack ? "text-white/45" : "text-[#ff9ebe]"}`}>
          Supabase Auth
        </p>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-white">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">{copy.description}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.18em] text-white/45">{copy.nickname}</label>
              <Input
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
                autoComplete="nickname"
                className="h-11 border-white/15 bg-black/50 text-white placeholder:text-white/25"
                placeholder="Nickname"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/45">{copy.email}</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-11 border-white/15 bg-black/50 text-white placeholder:text-white/25"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/45">{copy.password}</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-11 border-white/15 bg-black/50 text-white placeholder:text-white/25"
              placeholder="Password"
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.18em] text-white/45">Confirm password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="h-11 border-white/15 bg-black/50 text-white placeholder:text-white/25"
                placeholder="Confirm password"
              />
            </div>
          )}

          {message ? (
            <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="h-11 w-full bg-[#FF6B9D] text-black hover:bg-[#ff8bb2]">
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {copy.submit}
              </>
            ) : (
              copy.submit
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/60">
          <span>{copy.switchPrompt}</span>{" "}
          <Link
            className="text-[#ff9ebe] hover:text-[#ffc1d7]"
            href={`${basePath}/${mode === "login" ? "signup" : "login"}?returnTo=${encodeURIComponent(returnTo)}`}
          >
            {copy.switchAction}
          </Link>
        </div>
      </div>
    </div>
  )
}
