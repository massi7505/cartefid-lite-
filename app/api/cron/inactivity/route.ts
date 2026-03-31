import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // Peut être appelé par un admin (manuel) ou par un cron externe avec le secret
    const session = await getServerSession(authOptions)
    const cronSecret = req.headers.get('x-cron-secret')
    const isAdmin = session?.user?.role === 'ADMIN'
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

    if (!isAdmin && !isCron) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
    })

    if (!program) {
      return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 })
    }

    if (!program.inactivityEmailEnabled) {
      return NextResponse.json({ sent: 0, message: 'Email de relance désactivé' })
    }

    const inactivityDays = program.inactivityDays ?? 14
    const cutoffDate = new Date(Date.now() - inactivityDays * 86_400_000)
    // Ne pas re-envoyer avant que la même période soit écoulée
    const resendCutoff = new Date(Date.now() - inactivityDays * 86_400_000)

    // Trouver les utilisateurs inactifs : dernier tampon > inactivityDays
    const inactiveStamps = await prisma.stamp.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
    })

    const inactiveUserIds = inactiveStamps
      .filter(s => s._max.createdAt && s._max.createdAt < cutoffDate)
      .map(s => s.userId)

    if (inactiveUserIds.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Aucun client inactif' })
    }

    // Filtrer ceux qui n'ont pas reçu l'email récemment
    const usersToNotify = await prisma.user.findMany({
      where: {
        id: { in: inactiveUserIds },
        role: 'CLIENT',
        emailVerified: true,
        OR: [
          { inactivityEmailSentAt: null },
          { inactivityEmailSentAt: { lt: resendCutoff } },
        ],
      },
      include: {
        cards: {
          where: { programId: program.id },
          select: { stamps: true },
          take: 1,
        },
      },
    })

    if (usersToNotify.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Tous les clients inactifs ont déjà été relancés récemment' })
    }

    const appUrl = process.env.NEXTAUTH_URL ?? ''
    const { sendEmail, inactivityEmailTemplate, renderEmailTemplate } = await import('@/lib/email')

    let sent = 0
    const errors: string[] = []

    for (const user of usersToNotify) {
      try {
        const stamps = user.cards[0]?.stamps ?? 0
        const vars: Record<string, string> = {
          name: user.name,
          stamps: String(stamps),
          stampsRequired: String(program.stampsRequired),
          remaining: String(Math.max(0, program.stampsRequired - stamps)),
          rewardLabel: program.rewardLabel,
          programName: program.name,
          appUrl,
          inactivityDays: String(inactivityDays),
        }

        const subject = program.inactivityEmailSubject
          ? renderEmailTemplate(program.inactivityEmailSubject, vars)
          : `${program.name} — Ça fait longtemps qu'on ne vous a pas vu !`

        const html = program.inactivityEmailBody
          ? renderEmailTemplate(program.inactivityEmailBody, vars)
          : inactivityEmailTemplate(user.name, stamps, program.stampsRequired, program.name, appUrl)

        await sendEmail({ to: user.email, subject, html })

        await prisma.user.update({
          where: { id: user.id },
          data: { inactivityEmailSentAt: new Date() },
        })

        sent++
      } catch (err) {
        errors.push(`${user.email}: ${err}`)
      }
    }

    return NextResponse.json({
      sent,
      total: usersToNotify.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
