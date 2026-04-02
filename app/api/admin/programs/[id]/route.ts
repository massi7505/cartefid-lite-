import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  stampsRequired: z.number().int().min(3).max(20).optional(),
  rewardLabel: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  cardColor1: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cardColor2: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cardIcon: z.string().min(1).max(8).optional(),
  rewardExpiryDays: z.number().int().positive().nullable().optional(),
  emailVerificationEnabled: z.boolean().optional(),
  otpValidityMinutes: z.number().int().min(1).max(1440).optional(),
  // Branding (chemins relatifs /uploads/... ou URLs absolues)
  logoUrl: z.string().max(500).nullable().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  // Quick links (URLs externes — validation stricte conservée)
  phoneNumber: z.string().max(50).nullable().optional(),
  uberEatsUrl: z.string().url().max(500).nullable().optional().or(z.literal('')),
  deliverooUrl: z.string().url().max(500).nullable().optional().or(z.literal('')),
  // Card style
  stampShape: z.enum(['circle', 'rounded', 'square']).optional(),
  cardTextColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cardSubtitle: z.string().max(191).optional(),
  cardNote: z.string().max(1000).nullable().optional(),
  cardBgImageUrl: z.string().max(500).nullable().optional(),
  cardIconUrl: z.string().max(500).nullable().optional(),
  // PWA
  pwaEnabled: z.boolean().optional(),
  pwaShortName: z.string().max(100).nullable().optional(),
  // Notifications
  notificationSoundUrl: z.string().max(500).nullable().optional(),
  notificationSoundEnabled: z.boolean().optional(),
  // Email notifications
  stampEmailEnabled: z.boolean().optional(),
  stampEmailSubject: z.string().max(191).nullable().optional(),
  stampEmailBody: z.string().nullable().optional(),
  rewardEmailEnabled: z.boolean().optional(),
  rewardEmailSubject: z.string().max(191).nullable().optional(),
  rewardEmailBody: z.string().nullable().optional(),
  // Email de relance inactivité
  inactivityEmailEnabled: z.boolean().optional(),
  inactivityDays: z.number().int().min(5).max(90).optional(),
  inactivityEmailSubject: z.string().max(191).nullable().optional(),
  inactivityEmailBody: z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const { id } = await params
    // Support "active" as a special ID to fetch the first active program
    const program = id === 'active'
      ? await prisma.loyaltyProgram.findFirst({ where: { isActive: true } })
      : await prisma.loyaltyProgram.findUnique({ where: { id: Number(id) } })
    if (!program) return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 })
    return NextResponse.json(program)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const program = await prisma.loyaltyProgram.update({
      where: { id: Number(id) },
      data,
    })

    return NextResponse.json(program)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
