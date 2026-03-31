import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as cnt FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = '${table}' AND column_name = '${column}'
  `)
  if (Number(rows.cnt) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
    console.log(`  + ${table}.${column}`)
  } else {
    console.log(`  ✓ ${table}.${column} already exists`)
  }
}

async function main() {
  await addColumnIfMissing('User', 'resetOtp', 'VARCHAR(10) NULL')
  await addColumnIfMissing('User', 'resetOtpExpiry', 'DATETIME(3) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'otpValidityMinutes', 'INT NOT NULL DEFAULT 15')
  console.log('✅ OTP password reset migration complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
