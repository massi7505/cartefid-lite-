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
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ background: '#F4F7FE', color: '#1a202c' }}
    >
      <AdminSidebar
        userName={session.user.name}
        userRole={session.user.role}
        programName={programName}
      />

      {/*
        Content wrapper margins by breakpoint:
          mobile (< md):  no margin  — no sidebar, bottom nav instead
          tablet (md-lg): ml-16      — icon-only sidebar (w-16)
          desktop (lg+):  ml-64      — full sidebar (w-64)
      */}
      <div className="flex-1 md:ml-16 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <AdminHeader userName={session.user.name} programName={programName} />

        {/*
          Bottom padding by breakpoint:
            mobile:  5rem + safe-area  — clears the fixed bottom nav
            md+:     2rem              — normal padding
        */}
        <main className="
          flex-1 w-full overflow-x-hidden
          px-4 md:px-5 lg:px-8
          pt-1 lg:pt-0
          pb-[calc(4.5rem+env(safe-area-inset-bottom))]
          md:pb-8
        ">
          {children}
        </main>
      </div>
    </div>
  )
}
