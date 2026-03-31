import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    redirect('/login')
  }

  let programName = 'Fidélité'
  try {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
      select: { name: true },
    })
    if (program) programName = program.name
  } catch {}

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: '#F4F7FE', color: '#1a202c' }}>
      <AdminSidebar
        userName={session.user.name}
        userRole={session.user.role}
        programName={programName}
      />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <AdminHeader userName={session.user.name} />
        <main className="flex-1 px-4 lg:px-8 pb-8 pt-2 lg:pt-0 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
