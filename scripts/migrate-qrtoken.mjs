import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add qrToken as nullable
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `qrToken` VARCHAR(191) NULL')
    console.log('✓ qrToken column added')
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('  qrToken already exists, skipping')
    } else throw e
  }

  // Backfill UUIDs for existing users
  await prisma.$executeRawUnsafe('UPDATE `User` SET `qrToken` = UUID() WHERE `qrToken` IS NULL')
  console.log('✓ Existing users backfilled with UUIDs')

  // Make NOT NULL
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `User` MODIFY COLUMN `qrToken` VARCHAR(191) NOT NULL')
    console.log('✓ qrToken set to NOT NULL')
  } catch (e) {
    console.log('  NOT NULL already set:', e.message)
  }

  // Add unique index
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD UNIQUE INDEX `User_qrToken_key` (`qrToken`)')
    console.log('✓ Unique index added')
  } catch (e) {
    if (e.message.includes('Duplicate key name')) {
      console.log('  Unique index already exists')
    } else throw e
  }

  // Create SmtpSettings table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`SmtpSettings\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`host\` VARCHAR(191) NOT NULL DEFAULT '',
      \`port\` INT NOT NULL DEFAULT 587,
      \`user\` VARCHAR(191) NOT NULL DEFAULT '',
      \`pass\` VARCHAR(191) NOT NULL DEFAULT '',
      \`from\` VARCHAR(191) NOT NULL DEFAULT '',
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  console.log('✓ SmtpSettings table created')

  console.log('\n✅ Migration complete!')
}

main()
  .catch(e => { console.error('Migration failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
