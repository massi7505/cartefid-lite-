import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

async function main() {
  // ── LoyaltyProgram columns ─────────────────────────────────────────────────
  const programCols = [
    { name: 'cardTextColor',  sql: "ADD COLUMN `cardTextColor`  VARCHAR(20)  NOT NULL DEFAULT '#000000'" },
    { name: 'cardSubtitle',   sql: "ADD COLUMN `cardSubtitle`   VARCHAR(191) NOT NULL DEFAULT 'Carte Fidélité'" },
    { name: 'cardNote',       sql: 'ADD COLUMN `cardNote`       TEXT         NULL' },
    { name: 'cardBgImageUrl', sql: 'ADD COLUMN `cardBgImageUrl` VARCHAR(500) NULL' },
  ]

  for (const col of programCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`LoyaltyProgram\` ${col.sql}`)
      console.log(`✓ LoyaltyProgram.${col.name} added`)
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log(`  LoyaltyProgram.${col.name} already exists`)
      else throw e
    }
  }

  // ── User.shortCode ─────────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `shortCode` VARCHAR(8) NULL')
    console.log('✓ User.shortCode added')
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('  User.shortCode already exists')
    else throw e
  }

  // Unique index on shortCode
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD UNIQUE INDEX `User_shortCode_key` (`shortCode`)')
    console.log('✓ User.shortCode unique index added')
  } catch (e) {
    if (e.message.includes('Duplicate key name')) console.log('  shortCode index already exists')
    else throw e
  }

  // ── Backfill shortCode for existing users (raw SQL — works before prisma generate) ──
  const usersWithout = await prisma.$queryRaw`SELECT id FROM \`User\` WHERE shortCode IS NULL`
  console.log(`Backfilling shortCode for ${usersWithout.length} user(s)...`)

  for (const u of usersWithout) {
    let code = await generateCode()
    let tries = 0
    while (tries < 20) {
      const rows = await prisma.$queryRaw`SELECT id FROM \`User\` WHERE shortCode = ${code}`
      if (rows.length === 0) break
      code = await generateCode()
      tries++
    }
    await prisma.$executeRaw`UPDATE \`User\` SET shortCode = ${code} WHERE id = ${u.id}`
  }

  console.log('\n✅ Card advanced migration complete!')
  console.log('Run: node_modules/.bin/prisma generate')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
