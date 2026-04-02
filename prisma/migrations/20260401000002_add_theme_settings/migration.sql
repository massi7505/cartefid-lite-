-- CreateTable: ThemeSettings (client UI color theme)
CREATE TABLE IF NOT EXISTS `ThemeSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bgMain` VARCHAR(191) NOT NULL DEFAULT '#0D0D0D',
  `bgSurface` VARCHAR(191) NOT NULL DEFAULT '#141414',
  `bgSurfaceBorder` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.06)',
  `headerBg` VARCHAR(191) NOT NULL DEFAULT '#111111',
  `headerText` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
  `headerIcon` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.6)',
  `avatarBg` VARCHAR(191) NOT NULL DEFAULT '#CCFF00',
  `logoAccent` VARCHAR(191) NOT NULL DEFAULT '#CCFF00',
  `bannerBg` VARCHAR(191) NOT NULL DEFAULT 'rgba(123,47,190,0.18)',
  `bannerBorder` VARCHAR(191) NOT NULL DEFAULT 'rgba(123,47,190,0.3)',
  `bannerIconBg` VARCHAR(191) NOT NULL DEFAULT 'rgba(123,47,190,0.3)',
  `bannerTextTitle` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
  `bannerTextSub` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.5)',
  `statsBg` VARCHAR(191) NOT NULL DEFAULT '#141414',
  `statsBorder` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.06)',
  `statsValue` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
  `statsLabel` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.4)',
  `statsAccent` VARCHAR(191) NOT NULL DEFAULT '#CCFF00',
  `ctaBg` VARCHAR(191) NOT NULL DEFAULT '#CCFF00',
  `ctaBgHover` VARCHAR(191) NOT NULL DEFAULT '#B8E600',
  `ctaText` VARCHAR(191) NOT NULL DEFAULT '#000000',
  `ctaSubtext` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.3)',
  `textPrimary` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
  `textSecondary` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.7)',
  `textMuted` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.4)',
  `textGreeting` VARCHAR(191) NOT NULL DEFAULT 'rgba(255,255,255,0.4)',
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `ThemeSettings` (`id`,`bgMain`,`bgSurface`,`bgSurfaceBorder`,`headerBg`,`headerText`,`headerIcon`,`avatarBg`,`logoAccent`,`bannerBg`,`bannerBorder`,`bannerIconBg`,`bannerTextTitle`,`bannerTextSub`,`statsBg`,`statsBorder`,`statsValue`,`statsLabel`,`statsAccent`,`ctaBg`,`ctaBgHover`,`ctaText`,`ctaSubtext`,`textPrimary`,`textSecondary`,`textMuted`,`textGreeting`,`updatedAt`)
VALUES (1,'#0D0D0D','#141414','rgba(255,255,255,0.06)','#111111','#FFFFFF','rgba(255,255,255,0.6)','#CCFF00','#CCFF00','rgba(123,47,190,0.18)','rgba(123,47,190,0.3)','rgba(123,47,190,0.3)','#FFFFFF','rgba(255,255,255,0.5)','#141414','rgba(255,255,255,0.06)','#FFFFFF','rgba(255,255,255,0.4)','#CCFF00','#CCFF00','#B8E600','#000000','rgba(255,255,255,0.3)','#FFFFFF','rgba(255,255,255,0.7)','rgba(255,255,255,0.4)','rgba(255,255,255,0.4)',NOW());
