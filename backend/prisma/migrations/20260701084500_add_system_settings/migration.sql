-- CreateSystemSettings
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateSystemSettings_key_key
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateSystemSettings_key_idx
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");
