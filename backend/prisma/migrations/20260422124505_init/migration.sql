-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'INSTALLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FIDELITY', 'NO_FIDELITY');

-- CreateEnum
CREATE TYPE "SchedulePeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "rg" TEXT,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "housePhotoUrl" TEXT,
    "planId" TEXT,
    "planName" TEXT,
    "planPrice" DOUBLE PRECISION,
    "planSpeed" TEXT,
    "contractType" "ContractType" NOT NULL,
    "billingDate" INTEGER,
    "scheduledDate" TIMESTAMP(3),
    "schedulePeriod" "SchedulePeriod",
    "installerNotes" TEXT,
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "adhesionFee" DOUBLE PRECISION,
    "distanceFee" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "totalSetup" DOUBLE PRECISION,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "contactedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "source" TEXT DEFAULT 'web',

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeighborhoodRule" (
    "id" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "adhesionFee" DOUBLE PRECISION NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "overrideFee" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeighborhoodRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_cpf_key" ON "Lead"("cpf");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_neighborhood_idx" ON "Lead"("neighborhood");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "StatusHistory_leadId_idx" ON "StatusHistory"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodRule_neighborhood_key" ON "NeighborhoodRule"("neighborhood");

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
