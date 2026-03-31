import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cols = [
    { name: 'cardColor1',  sql: "ADD COLUMN `cardColor1`  VARCHAR(191) NOT NULL DEFAULT '#1A3526'" },
    { name: 'cardColor2',  sql: "ADD COLUMN `cardColor2`  VARCHAR(191) NOT NULL DEFAULT '#0F2318'" },
    { name: 'accentColor', sql: "ADD COLUMN `accentColor` VARCHAR(191) NOT NULL DEFAULT '#3DD68C'" },
    { name: 'cardIcon',    sql: "ADD COLUMN `cardIcon`    VARCHAR(191) NOT NULL DEFAULT '🎯'" },
  ]

  for (const col of cols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`LoyaltyProgram\` ${col.sql}`)
      console.log(`✓ ${col.name} added`)
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log(`  ${col.name} already exists`)
      } else throw e
    }
  }

  console.log('\n✅ Card customization migration complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
