-- Migration to add coupon tracking
-- Uses SQLSTATE codes for reliable error handling

-- Add couponId column to Order
DO $$
BEGIN
  ALTER TABLE "Order" ADD COLUMN "couponId" TEXT;
EXCEPTION
  WHEN SQLSTATE '42701' THEN NULL; -- duplicate_column
END $$;

-- Create CouponUsage table
DO $$
BEGIN
  CREATE TABLE "CouponUsage" (
      "id" TEXT NOT NULL,
      "couponId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
  );
EXCEPTION
  WHEN SQLSTATE '42P07' THEN NULL; -- duplicate_table
END $$;

-- Add unique constraint (ignore error if exists)
DO $$
BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_userId_key" UNIQUE ("couponId", "userId");
EXCEPTION
  WHEN SQLSTATE '42P10' THEN NULL; -- duplicate_constraint
END $$;

-- Add foreign keys (ignore errors if exist)
DO $$
BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL; -- duplicate_object
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
END $$;

-- Create indexes
DO $$
BEGIN
  CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");
EXCEPTION
  WHEN SQLSTATE '42P07' THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
EXCEPTION
  WHEN SQLSTATE '42P07' THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");
EXCEPTION
  WHEN SQLSTATE '42P07' THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");
EXCEPTION
  WHEN SQLSTATE '42P07' THEN NULL;
END $$;

-- Add foreign key constraint to Order
DO $$
BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
END $$;
