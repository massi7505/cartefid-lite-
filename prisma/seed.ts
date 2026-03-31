import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default loyalty program
  const program = await prisma.loyaltyProgram.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Programme Fidélité',
      description: 'Cumulez des tampons et obtenez des récompenses !',
      stampsRequired: 10,
      rewardLabel: 'Un article offert',
      isActive: true,
      cardColor1: '#CCFF00',
      cardColor2: '#A8D400',
      accentColor: '#CCFF00',
      cardIcon: '⭐',
    },
  })

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fidelite.fr' },
    update: {},
    create: {
      email: 'admin@fidelite.fr',
      name: 'Administrateur',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  })

  // Create demo client
  const clientHash = await bcrypt.hash('client123', 12)
  const client = await prisma.user.upsert({
    where: { email: 'client@fidelite.fr' },
    update: {},
    create: {
      email: 'client@fidelite.fr',
      name: 'Marie Dupont',
      phone: '0612345678',
      passwordHash: clientHash,
      role: Role.CLIENT,
      cards: {
        create: {
          programId: program.id,
          stamps: 3,
        },
      },
    },
  })

  console.log('Seed terminé !')
  console.log('Admin : admin@fidelite.fr / admin123')
  console.log('Client : client@fidelite.fr / client123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
