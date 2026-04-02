import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, stampEmailTemplate, rewardEmailTemplate, renderEmailTemplate } from '@/lib/email'

const redeemSchema = z.object({ token: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { token } = redeemSchema.parse(body)

    const [qrCode, pwaSettings] = await Promise.all([
      prisma.qRCode.findUnique({ where: { token }, include: { program: true } }),
      prisma.pwaSettings.findFirst({ select: { qrEnabled: true } }),
    ])

    if (pwaSettings?.qrEnabled === false) {
      return NextResponse.json({ error: 'La fonctionnalité QR code est désactivée' }, { status: 403 })
    }

    if (!qrCode) return NextResponse.json({ error: 'QR Code invalide' }, { status: 404 })
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'QR Code expiré' }, { status: 410 })
    }
    if (!qrCode.multiUse && qrCode.usedAt) {
      return NextResponse.json({ error: 'QR Code déjà utilisé' }, { status: 409 })
    }
    if (!qrCode.program.isActive) {
      return NextResponse.json({ error: 'Programme inactif' }, { status: 403 })
    }

    const card = await prisma.loyaltyCard.findFirst({
      where: { userId: Number(session.user.id), programId: qrCode.programId },
      include: { program: true, user: true },
    })

    if (!card) return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })

    const newStamps = card.stamps + 1
    const stampsRequired = card.program.stampsRequired
    const rewardUnlocked = newStamps >= stampsRequired

    await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: card.id },
        data: { stamps: rewardUnlocked ? 0 : newStamps },
      }),
      prisma.stamp.create({
        data: {
          cardId: card.id,
          userId: Number(session.user.id),
          grantedBy: Number(session.user.id),
          note: `Scan QR ${token.slice(0, 8)}`,
        },
      }),
      ...(rewardUnlocked
        ? [prisma.reward.create({
            data: { cardId: card.id, label: card.program.rewardLabel },
          })]
        : []),
      ...(!qrCode.multiUse
        ? [prisma.qRCode.update({ where: { id: qrCode.id }, data: { usedAt: new Date() } })]
        : []),
    ])

    const prog = card.program as typeof card.program & {
      stampEmailEnabled?: boolean
      stampEmailSubject?: string | null
      stampEmailBody?: string | null
      rewardEmailSubject?: string | null
      rewardEmailBody?: string | null
    }

    if (prog.stampEmailEnabled !== false) {
      const appUrl = process.env.NEXTAUTH_URL ?? ''
      const vars = {
        name: card.user.name,
        stamps: String(newStamps),
        stampsRequired: String(stampsRequired),
        remaining: String(stampsRequired - newStamps),
        rewardLabel: card.program.rewardLabel,
        programName: card.program.name,
        appUrl,
      }
      try {
        if (rewardUnlocked) {
          const subject = prog.rewardEmailSubject
            ? renderEmailTemplate(prog.rewardEmailSubject, vars)
            : '🎁 Votre récompense est disponible !'
          const html = prog.rewardEmailBody
            ? renderEmailTemplate(prog.rewardEmailBody, vars)
            : rewardEmailTemplate(card.user.name, card.program.rewardLabel)
          await sendEmail({ to: card.user.email, subject, html })
        } else {
          const subject = prog.stampEmailSubject
            ? renderEmailTemplate(prog.stampEmailSubject, vars)
            : 'Vous avez reçu un tampon !'
          const html = prog.stampEmailBody
            ? renderEmailTemplate(prog.stampEmailBody, vars)
            : stampEmailTemplate(card.user.name, newStamps, stampsRequired)
          await sendEmail({ to: card.user.email, subject, html })
        }
      } catch {
        // Email non-bloquant
      }
    }

    return NextResponse.json({
      success: true,
      stampsNow: rewardUnlocked ? 0 : newStamps,
      stampsRequired,
      rewardUnlocked,
      rewardLabel: rewardUnlocked ? card.program.rewardLabel : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
