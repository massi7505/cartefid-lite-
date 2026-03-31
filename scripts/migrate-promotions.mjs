import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`Promotion\` (
      \`id\`          INT           NOT NULL AUTO_INCREMENT,
      \`title\`       VARCHAR(191)  NOT NULL,
      \`description\` TEXT          NULL,
      \`imageUrl\`    VARCHAR(500)  NULL,
      \`active\`      TINYINT(1)    NOT NULL DEFAULT 1,
      \`expiresAt\`   DATETIME(3)   NULL,
      \`createdAt\`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  console.log('✅ Promotion table created!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
