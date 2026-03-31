-- CreateTable: PwaSettings (PWA configuration independent from LoyaltyProgram)
CREATE TABLE `PwaSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `appName` VARCHAR(191) NOT NULL DEFAULT 'Fidélité',
  `shortName` VARCHAR(12) NOT NULL DEFAULT 'Fidélité',
  `description` VARCHAR(191) NOT NULL DEFAULT 'Votre carte de fidélité numérique',
  `startUrl` VARCHAR(50) NOT NULL DEFAULT '/carte',
  `themeColor` VARCHAR(20) NOT NULL DEFAULT '#0D0D0D',
  `backgroundColor` VARCHAR(20) NOT NULL DEFAULT '#0D0D0D',
  `display` VARCHAR(20) NOT NULL DEFAULT 'standalone',
  `orientation` VARCHAR(20) NOT NULL DEFAULT 'portrait',
  `logoUrl` VARCHAR(500) NULL,
  `faviconUrl` VARCHAR(500) NULL,
  `splashUrl` VARCHAR(500) NULL,
  `pwaEnabled` BOOLEAN NOT NULL DEFAULT true,
  `offlineMessage` VARCHAR(191) NOT NULL DEFAULT 'Vous êtes hors connexion. Reconnectez-vous pour scanner.',
  `installPromptEnabled` BOOLEAN NOT NULL DEFAULT true,
  `installPromptDelay` INT NULL DEFAULT 30,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed a default row so the app always has settings
INSERT INTO `PwaSettings` (`appName`, `shortName`, `description`, `startUrl`, `themeColor`, `backgroundColor`, `display`, `orientation`, `pwaEnabled`, `offlineMessage`, `installPromptEnabled`, `installPromptDelay`, `updatedAt`)
VALUES ('Fidélité', 'Fidélité', 'Votre carte de fidélité numérique', '/carte', '#0D0D0D', '#0D0D0D', 'standalone', 'portrait', true, 'Vous êtes hors connexion. Reconnectez-vous pour scanner.', true, 30, NOW());
