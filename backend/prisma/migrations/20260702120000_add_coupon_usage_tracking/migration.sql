-- Add couponId to Order (idempotent - only if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'couponId'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "couponId" TEXT;
  END IF;
END $$;

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Order_couponId_fkey'
  ) THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Create index only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Order_couponId_idx'
  ) THEN
    CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");
  END IF;
END $$;

-- Create CouponUsage table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'CouponUsage'
  ) THEN
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

    CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
    CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");
    CREATE INDEX "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");
  END IF;
END $$;
