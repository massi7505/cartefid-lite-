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
  await addColumnIfMissing('User', 'emailVerified', 'TINYINT(1) NOT NULL DEFAULT 1')
  await addColumnIfMissing('User', 'verifyToken', 'VARCHAR(191) NULL')
  await addColumnIfMissing('LoyaltyProgram', 'emailVerificationEnabled', 'TINYINT(1) NOT NULL DEFAULT 0')

  // Unique index on verifyToken
  const [idx] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as cnt FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'User' AND index_name = 'User_verifyToken_key'
  `)
  if (Number(idx.cnt) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`User\` ADD UNIQUE INDEX \`User_verifyToken_key\` (\`verifyToken\`)`)
    console.log('  + unique index on User.verifyToken')
  }

  console.log('✅ Email verification migration complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
