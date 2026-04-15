-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('SCAM', 'VEHICLE');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."EvidenceType" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "name" TEXT,
    "rut" TEXT,
    "plate" TEXT,
    "description" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "legalAccepted" BOOLEAN NOT NULL DEFAULT false,
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "type" "public"."EvidenceType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT,
    "text" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Report_rut_idx" ON "public"."Report"("rut");

-- CreateIndex
CREATE INDEX "Report_plate_idx" ON "public"."Report"("plate");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "Evidence_reportId_idx" ON "public"."Evidence"("reportId");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

