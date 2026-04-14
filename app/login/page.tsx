import { AuthPanel } from "@/components/auth-panel"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black px-4 text-white">
      <AuthPanel mode="login" />
    </div>
  )
}
