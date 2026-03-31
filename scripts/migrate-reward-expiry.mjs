import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add rewardExpiryDays to LoyaltyProgram (null = never expires)
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `LoyaltyProgram` ADD COLUMN `rewardExpiryDays` INT NULL'
    )
    console.log('✓ rewardExpiryDays added to LoyaltyProgram')
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('  rewardExpiryDays already exists')
    else throw e
  }

  // Add expiresAt to Reward (null = never expires)
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `Reward` ADD COLUMN `expiresAt` DATETIME(3) NULL'
    )
    console.log('✓ expiresAt added to Reward')
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('  expiresAt already exists')
    else throw e
  }

  console.log('\n✅ Reward expiry migration complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
