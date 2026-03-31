import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOrCreatePwa() {
  const existing = await prisma.pwaSettings.findFirst()
  if (existing) return existing
  return prisma.pwaSettings.create({ data: {} })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const pwa = await getOrCreatePwa()
    return NextResponse.json(pwa)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const pwa = await getOrCreatePwa()

    const allowed = [
      'appName', 'shortName', 'description', 'startUrl',
      'themeColor', 'backgroundColor', 'display', 'orientation',
      'logoUrl', 'faviconUrl', 'splashUrl',
      'pwaEnabled', 'offlineMessage', 'installPromptEnabled', 'installPromptDelay',
    ]
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }
    // Validate shortName max 12 chars
    if (typeof data.shortName === 'string') {
      data.shortName = data.shortName.slice(0, 12)
    }

    const updated = await prisma.pwaSettings.update({ where: { id: pwa.id }, data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
