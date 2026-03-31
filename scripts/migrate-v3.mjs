/**
 * Migration v3 — run once after schema update
 * Adds: Promotion.couponCode, buttonLabel, buttonUrl
 *       LoyaltyProgram.logoUrl, faviconUrl, phoneNumber, uberEatsUrl, deliverooUrl
 *
 * Usage: node scripts/migrate-v3.mjs
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addColumnIfMissing(table, column, definition) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
    )
    console.log(`✅  ${table}.${column} added`)
  } catch (e) {
    if (e.message?.includes('Duplicate column')) {
      console.log(`⏭️   ${table}.${column} already exists`)
    } else {
      throw e
    }
  }
}

async function main() {
  console.log('Running migration v3…\n')

  // Promotion enhancements
  await addColumnIfMissing('Promotion', 'couponCode',  'VARCHAR(191) NULL')
  await addColumnIfMissing('Promotion', 'buttonLabel', 'VARCHAR(191) NULL')
  await addColumnIfMissing('Promotion', 'buttonUrl',   'VARCHAR(500) NULL')

  // LoyaltyProgram branding & quick links
  await addColumnIfMissing('LoyaltyProgram', 'logoUrl',     'VARCHAR(500) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'faviconUrl',  'VARCHAR(500) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'phoneNumber', 'VARCHAR(50) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'uberEatsUrl', 'VARCHAR(500) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'deliverooUrl','VARCHAR(500) NULL')

  console.log('\nMigration v3 terminée !')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
