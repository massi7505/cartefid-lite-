import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon',
  'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/wave', 'audio/x-wav',
]
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Type non supporté (jpg, png, webp, gif, svg, ico, mp3, ogg, wav)',
      }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin'
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
