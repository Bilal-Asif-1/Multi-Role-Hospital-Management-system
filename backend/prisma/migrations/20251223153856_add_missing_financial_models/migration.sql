-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "salary_withdrawals" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_account" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "appointmentEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "appointmentShares" JSONB,
    "totalSalary" DOUBLE PRECISION NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_withdrawals_employeeId_employeeType_idx" ON "salary_withdrawals"("employeeId", "employeeType");

-- CreateIndex
CREATE INDEX "salary_withdrawals_status_idx" ON "salary_withdrawals"("status");

-- CreateIndex
CREATE INDEX "salaries_employeeId_employeeType_idx" ON "salaries"("employeeId", "employeeType");

-- CreateIndex
CREATE INDEX "salaries_isDeleted_idx" ON "salaries"("isDeleted");

-- CreateIndex
CREATE INDEX "salaries_periodStart_periodEnd_idx" ON "salaries"("periodStart", "periodEnd");
