import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalClients,
      newClientsToday,
      newClientsThisWeek,
      totalStamps,
      stampsToday,
      stampsThisMonth,
      totalRewards,
      rewardsAvailable,
      rewardsThisMonth,
      totalCards,
      cardsWithRewards,
      recentStamps,
      topClients,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startOfWeek } } }),
      prisma.stamp.count(),
      prisma.stamp.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.stamp.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.reward.count(),
      prisma.reward.count({ where: { isUsed: false, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      prisma.reward.count({ where: { redeemedAt: { gte: startOfMonth } } }),
      prisma.loyaltyCard.count(),
      prisma.loyaltyCard.count({ where: { rewards: { some: {} } } }),
      prisma.stamp.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.loyaltyCard.findMany({
        take: 10,
        orderBy: { stamps: 'desc' },
        where: { user: { role: 'CLIENT' } },
        select: {
          stamps: true,
          user: { select: { id: true, name: true, email: true } },
          rewards: { select: { id: true } },
        },
      }),
    ])

    // Group stamps by day using raw SQL (MySQL DATE() function)
    const stampsPerDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Stamp
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    const completionRate = totalCards > 0 ? Math.round((cardsWithRewards / totalCards) * 100) : 0

    return NextResponse.json({
      totalClients,
      newClientsToday,
      newClientsThisWeek,
      totalStamps,
      stampsToday,
      stampsThisMonth,
      totalRewards,
      rewardsAvailable,
      rewardsThisMonth,
      completionRate,
      stampsPerDay: stampsPerDay.map(d => ({
        date: d.date.toISOString().slice(0, 10),
        count: Number(d.count),
      })),
      recentStamps,
      topClients,
    }, {
      headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
