-- Add couponId to Order (PostgreSQL direct - will error if exists but won't crash)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponId" TEXT;

-- Add foreign key (use NOT VALID to avoid errors if constraint exists)
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;

-- Create index (will silently fail if exists)
CREATE INDEX IF NOT EXISTS "Order_couponId_idx" ON "Order"("couponId");

-- Create CouponUsage table (will silently fail if exists)
CREATE TABLE IF NOT EXISTS "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CouponUsage_couponId_userId_key" UNIQUE ("couponId", "userId"),
    CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX IF NOT EXISTS "CouponUsage_userId_idx" ON "CouponUsage"("userId");
CREATE INDEX IF NOT EXISTS "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");
