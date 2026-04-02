import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { emitStamp } from '@/lib/events'

const addStampSchema = z.object({
  userId: z.number(),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, note } = addStampSchema.parse(body)

    const card = await prisma.loyaltyCard.findFirst({
      where: { userId },
      include: { program: true, user: true },
    })

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    if (!card.program.isActive) {
      return NextResponse.json({ error: 'Programme inactif' }, { status: 403 })
    }

    const newStamps = card.stamps + 1
    const { stampsRequired, rewardLabel, rewardExpiryDays } = card.program
    const rewardUnlocked = newStamps >= stampsRequired

    const expiresAt = rewardUnlocked && rewardExpiryDays
      ? new Date(Date.now() + rewardExpiryDays * 86_400_000)
      : null

    let rewardId: number | null = null

    await prisma.$transaction(async (tx) => {
      await tx.loyaltyCard.update({
        where: { id: card.id },
        data: { stamps: rewardUnlocked ? 0 : newStamps },
      })
      await tx.stamp.create({
        data: {
          cardId: card.id,
          userId,
          grantedBy: Number(session.user.id),
          note: note ?? 'Tampon ajouté par le commerçant',
        },
      })
      if (rewardUnlocked) {
        const reward = await tx.reward.create({
          data: { cardId: card.id, label: rewardLabel, ...(expiresAt ? { expiresAt } : {}) },
        })
        rewardId = reward.id
      }
    })

    // Real-time SSE push to connected client
    emitStamp({
      userId,
      stampsNow: rewardUnlocked ? 0 : newStamps,
      stampsRequired,
      rewardUnlocked,
      rewardLabel: rewardUnlocked ? rewardLabel : null,
    })

    const prog = card.program as typeof card.program & {
      stampEmailEnabled?: boolean
      stampEmailSubject?: string | null
      stampEmailBody?: string | null
      rewardEmailEnabled?: boolean
      rewardEmailSubject?: string | null
      rewardEmailBody?: string | null
      notificationSoundUrl?: string | null
      notificationSoundEnabled?: boolean
    }
    const soundUrl = prog.notificationSoundEnabled !== false ? (prog.notificationSoundUrl ?? undefined) : undefined
    const remaining = stampsRequired - newStamps

    // Email + push (fire & forget — never block the response)
    Promise.all([
      // Email
      import('@/lib/email').then(async ({ sendEmail, stampEmailTemplate, rewardEmailTemplate, renderEmailTemplate }) => {
        const appUrl = process.env.NEXTAUTH_URL ?? ''
        const vars = {
          name: card.user.name,
          stamps: String(newStamps),
          stampsRequired: String(stampsRequired),
          remaining: String(remaining),
          rewardLabel,
          programName: card.program.name,
          appUrl,
        }

        if (rewardUnlocked) {
          if (prog.rewardEmailEnabled === false) return
          const subject = prog.rewardEmailSubject
            ? renderEmailTemplate(prog.rewardEmailSubject, vars)
            : '🎁 Votre récompense est disponible !'
          const html = prog.rewardEmailBody
            ? renderEmailTemplate(prog.rewardEmailBody, vars)
            : rewardEmailTemplate(card.user.name, rewardLabel)
          await sendEmail({ to: card.user.email, subject, html })
        } else {
          if (prog.stampEmailEnabled === false) return
          const subject = prog.stampEmailSubject
            ? renderEmailTemplate(prog.stampEmailSubject, vars)
            : 'Vous avez reçu un tampon !'
          const html = prog.stampEmailBody
            ? renderEmailTemplate(prog.stampEmailBody, vars)
            : stampEmailTemplate(card.user.name, newStamps, stampsRequired)
          await sendEmail({ to: card.user.email, subject, html })
        }
      }).catch(() => {}),

      // Push notification
      import('@/lib/push').then(async ({ sendPushToUser }) => {
        if (rewardUnlocked) {
          await sendPushToUser(userId, {
            title: '🎁 Récompense débloquée !',
            body: `Félicitations ! Vous avez obtenu : ${rewardLabel}`,
            url: '/carte',
            sound: soundUrl,
          })
        } else {
          await sendPushToUser(userId, {
            title: '✅ Tampon ajouté !',
            body: remaining === 1
              ? `Plus qu'un tampon pour votre récompense !`
              : `${newStamps}/${stampsRequired} tampons — encore ${remaining} pour votre récompense`,
            url: '/carte',
            sound: soundUrl,
          })
        }
      }).catch(() => {}),
    ]).catch(() => {})

    return NextResponse.json({
      success: true,
      stampsNow: rewardUnlocked ? 0 : newStamps,
      rewardUnlocked,
      rewardId,
      rewardLabel: rewardUnlocked ? rewardLabel : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
