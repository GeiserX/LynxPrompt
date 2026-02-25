-- CreateTable
CREATE TABLE "FederatedInstance" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "publicBlueprintCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FederatedInstance_domain_key" ON "FederatedInstance"("domain");

-- CreateIndex
CREATE INDEX "FederatedInstance_verified_idx" ON "FederatedInstance"("verified");

-- CreateIndex
CREATE INDEX "FederatedInstance_lastSeenAt_idx" ON "FederatedInstance"("lastSeenAt");
