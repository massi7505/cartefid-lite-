-- Add coupon code, CTA button, and expiry fields to Promotion table
-- Note: these columns were already added via prisma db push — migration marked as applied manually
ALTER TABLE `Promotion`
  ADD COLUMN `couponCode`  VARCHAR(191) NULL,
  ADD COLUMN `buttonLabel` VARCHAR(191) NULL,
  ADD COLUMN `buttonUrl`   VARCHAR(500) NULL,
  ADD COLUMN `expiresAt`   DATETIME(3)  NULL;
