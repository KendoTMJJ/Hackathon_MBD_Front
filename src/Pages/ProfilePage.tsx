import { useAuth0 } from "@auth0/auth0-react"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <main className="p-6">Cargando perfil...</main>
  if (!isAuthenticated) return null

  return (
    <main className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">Mi perfil</h1>
      <section className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#141420] p-4">
        {user?.picture && (
          <img
            src={String(user.picture) || "/placeholder.svg"}
            alt={String(user?.name ?? "Usuario")}
            className="h-16 w-16 rounded-xl"
          />
        )}
        <div className="grid">
          <span className="text-lg font-semibold">{user?.name}</span>
          <span className="text-white/80">{user?.email}</span>
          <span className="text-xs text-white/60">ID: {user?.sub}</span>
        </div>
      </section>
    </main>
  )
}