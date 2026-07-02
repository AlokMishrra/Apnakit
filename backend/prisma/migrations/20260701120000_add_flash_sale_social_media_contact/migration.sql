-- CreateFlashSale
CREATE TABLE "FlashSale" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL DEFAULT '',
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "title" TEXT,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashSale_pkey" PRIMARY KEY ("id")
);

-- CreateFlashSale_groupId_idx
CREATE INDEX "FlashSale_groupId_idx" ON "FlashSale"("groupId");

-- CreateFlashSale_productId_idx
CREATE INDEX "FlashSale_productId_idx" ON "FlashSale"("productId");

-- CreateFlashSale_isActive_idx
CREATE INDEX "FlashSale_isActive_idx" ON "FlashSale"("isActive");

-- CreateFlashSale_startsAt_idx
CREATE INDEX "FlashSale_startsAt_idx" ON "FlashSale"("startsAt");

-- CreateFlashSale_expiresAt_idx
CREATE INDEX "FlashSale_expiresAt_idx" ON "FlashSale"("expiresAt");

-- AddFlashSaleProductForeignKey
ALTER TABLE "FlashSale" ADD CONSTRAINT "FlashSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddFlashSaleVariantForeignKey
ALTER TABLE "FlashSale" ADD CONSTRAINT "FlashSale_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateDeliveryZone
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "prepaidOnly" BOOLEAN NOT NULL DEFAULT false,
    "minOrderFreeDelivery" DECIMAL(10,2),
    "estimatedDays" INTEGER NOT NULL DEFAULT 3,
    "estimatedHours" INTEGER,
    "estimatedMinutes" INTEGER,
    "deliveryTimeUnit" TEXT NOT NULL DEFAULT 'days',
    "cities" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateDeliveryZone_pincode_key
CREATE UNIQUE INDEX "DeliveryZone_pincode_key" ON "DeliveryZone"("pincode");

-- CreateDeliveryZone_pincode_idx
CREATE INDEX "DeliveryZone_pincode_idx" ON "DeliveryZone"("pincode");

-- CreateDeliveryZone_city_idx
CREATE INDEX "DeliveryZone_city_idx" ON "DeliveryZone"("city");

-- CreateDeliveryZone_state_idx
CREATE INDEX "DeliveryZone_state_idx" ON "DeliveryZone"("state");

-- CreateDeliveryZone_isActive_idx
CREATE INDEX "DeliveryZone_isActive_idx" ON "DeliveryZone"("isActive");

-- CreateAppBannerConfig
CREATE TABLE "AppBannerConfig" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'ApnaKit is better on the app',
    "rating" TEXT DEFAULT '4.6',
    "downloadCount" TEXT DEFAULT '10L+',
    "iconType" TEXT NOT NULL DEFAULT 'image',
    "iconImage" TEXT,
    "iconBgColor" TEXT NOT NULL DEFAULT '#FACC15',
    "iconFgColor" TEXT NOT NULL DEFAULT '#7C3AED',
    "buttonText" TEXT NOT NULL DEFAULT 'Use the App',
    "showRating" BOOLEAN NOT NULL DEFAULT true,
    "showDownloadCount" BOOLEAN NOT NULL DEFAULT true,
    "showAppStore" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppBannerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateSocialMediaConfig
CREATE TABLE "SocialMediaConfig" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "facebook" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "linkedin" TEXT,
    "pinterest" TEXT,
    "telegram" TEXT,
    "whatsapp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateContactMessage
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateContactMessage_status_idx
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

-- CreateContactMessage_createdAt_idx
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
