import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cols = [
    { name: 'stampShape',   sql: "ADD COLUMN `stampShape`   VARCHAR(20)  NOT NULL DEFAULT 'rounded'" },
    { name: 'pwaEnabled',   sql: "ADD COLUMN `pwaEnabled`   TINYINT(1)   NOT NULL DEFAULT 1" },
    { name: 'pwaShortName', sql: "ADD COLUMN `pwaShortName` VARCHAR(100) NULL" },
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

  console.log('\n✅ PWA migration complete!')
  console.log('Run: node_modules/.bin/prisma generate')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
