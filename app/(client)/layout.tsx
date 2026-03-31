import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientNav from '@/components/client/ClientNav'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <ClientNav />
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
