/**
 * Migration push notifications — run once
 * Creates the PushSubscription table
 * Usage: node scripts/migrate-push.mjs
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Running push migration…\n')
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`PushSubscription\` (
        \`id\`        INT NOT NULL AUTO_INCREMENT,
        \`userId\`    INT NOT NULL,
        \`endpoint\`  TEXT NOT NULL,
        \`p256dh\`    TEXT NOT NULL,
        \`auth\`      TEXT NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`PushSubscription_userId_fkey\` (\`userId\`),
        CONSTRAINT \`PushSubscription_userId_fkey\`
          FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('✅  PushSubscription table created (or already exists)')
  } catch (e) {
    if (e.message?.includes('already exists')) {
      console.log('⏭️   PushSubscription already exists')
    } else {
      throw e
    }
  }
  console.log('\nMigration push terminée !')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
