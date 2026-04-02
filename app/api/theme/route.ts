import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const colorValue = z.string().max(80).regex(/^(#[0-9A-Fa-f]{3,8}|rgba?\([\d.,\s%]+\)|[a-z]+)$/, 'Couleur CSS invalide')

const themeSchema = z.object({
  bgMain: colorValue,
  bgSurface: colorValue,
  bgSurfaceBorder: colorValue,
  headerBg: colorValue,
  headerText: colorValue,
  headerIcon: colorValue,
  avatarBg: colorValue,
  logoAccent: colorValue,
  bannerBg: colorValue,
  bannerBorder: colorValue,
  bannerIconBg: colorValue,
  bannerTextTitle: colorValue,
  bannerTextSub: colorValue,
  statsBg: colorValue,
  statsBorder: colorValue,
  statsValue: colorValue,
  statsLabel: colorValue,
  statsAccent: colorValue,
  ctaBg: colorValue,
  ctaBgHover: colorValue,
  ctaText: colorValue,
  ctaSubtext: colorValue,
  textPrimary: colorValue,
  textSecondary: colorValue,
  textMuted: colorValue,
  textGreeting: colorValue,
})

const DEFAULT_THEME = {
  bgMain: '#0D0D0D', bgSurface: '#141414', bgSurfaceBorder: 'rgba(255,255,255,0.06)',
  headerBg: '#111111', headerText: '#FFFFFF', headerIcon: 'rgba(255,255,255,0.6)',
  avatarBg: '#CCFF00', logoAccent: '#CCFF00',
  bannerBg: 'rgba(123,47,190,0.18)', bannerBorder: 'rgba(123,47,190,0.3)',
  bannerIconBg: 'rgba(123,47,190,0.3)', bannerTextTitle: '#FFFFFF',
  bannerTextSub: 'rgba(255,255,255,0.5)',
  statsBg: '#141414', statsBorder: 'rgba(255,255,255,0.06)',
  statsValue: '#FFFFFF', statsLabel: 'rgba(255,255,255,0.4)', statsAccent: '#CCFF00',
  ctaBg: '#CCFF00', ctaBgHover: '#B8E600', ctaText: '#000000',
  ctaSubtext: 'rgba(255,255,255,0.3)',
  textPrimary: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)', textGreeting: 'rgba(255,255,255,0.4)',
}

// GET /api/theme — public, no auth required
export async function GET() {
  try {
    const theme = await prisma.themeSettings.findFirst()
    return NextResponse.json(theme ?? DEFAULT_THEME, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch {
    return NextResponse.json(DEFAULT_THEME)
  }
}

// POST /api/theme — admin only
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const body = themeSchema.parse(await req.json())
    const existing = await prisma.themeSettings.findFirst()
    const theme = existing
      ? await prisma.themeSettings.update({ where: { id: existing.id }, data: body })
      : await prisma.themeSettings.create({ data: body })
    // Invalidate client layout cache so colors update immediately
    revalidatePath('/carte')
    revalidatePath('/historique')
    revalidatePath('/profil')
    revalidatePath('/offres')
    return NextResponse.json(theme)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
