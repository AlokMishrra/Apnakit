-- Migration to add coupon tracking (use separate statements that won't break if already exist)

-- Add couponId column to Order (ignore error if exists)
DO $$
BEGIN
  ALTER TABLE "Order" ADD COLUMN "couponId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create CouponUsage table (ignore error if exists)
DO $$
BEGIN
  CREATE TABLE "CouponUsage" (
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create indexes (will be skipped if already exist)
DO $$
BEGIN
  CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraint (ignore error if exists)
DO $$
BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
