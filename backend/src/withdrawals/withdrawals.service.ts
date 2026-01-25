import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WithdrawalStatus, InvoiceStatus } from '@prisma/client'

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  async create(employeeId: string, employeeType: 'DOCTOR' | 'NURSE', amount: number, notes?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than 0')
    }

    // Get employee to verify they exist
    if (employeeType === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: employeeId } })
      if (!doctor) {
        throw new NotFoundException('Doctor not found')
      }
    } else {
      const nurse = await this.prisma.nurse.findUnique({ where: { id: employeeId } })
      if (!nurse) {
        throw new NotFoundException('Nurse not found')
      }
    }

    // Get or create hospital account
    let hospitalAccount = await this.prisma.hospitalAccount.findFirst()
    if (!hospitalAccount) {
      hospitalAccount = await this.prisma.hospitalAccount.create({
        data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
      })
    }

    // Check if sufficient balance
    if (hospitalAccount.balance < amount) {
      throw new BadRequestException('Insufficient hospital account balance')
    }

    // Create withdrawal request
    const withdrawal = await this.prisma.salaryWithdrawal.create({
      data: {
        employeeId,
        employeeType,
        amount,
        status: WithdrawalStatus.PENDING,
        notes,
      },
    })

    return withdrawal
  }

  async findAll(filters?: { employeeId?: string; employeeType?: string; status?: WithdrawalStatus }) {
    const where: any = {}
    if (filters?.employeeId) where.employeeId = filters.employeeId
    if (filters?.employeeType) where.employeeType = filters.employeeType
    if (filters?.status) where.status = filters.status

    return this.prisma.salaryWithdrawal.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const withdrawal = await this.prisma.salaryWithdrawal.findUnique({
      where: { id },
    })

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found')
    }

    return withdrawal
  }

  async approve(id: string) {
    const withdrawal = await this.findOne(id)

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending')
    }

    // Get or create hospital account
    let hospitalAccount = await this.prisma.hospitalAccount.findFirst()
    if (!hospitalAccount) {
      hospitalAccount = await this.prisma.hospitalAccount.create({
        data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
      })
    }

    // Check balance again
    if (hospitalAccount.balance < withdrawal.amount) {
      throw new BadRequestException('Insufficient hospital account balance')
    }

    // Update hospital account
    await this.prisma.hospitalAccount.update({
      where: { id: hospitalAccount.id },
      data: {
        balance: {
          decrement: withdrawal.amount,
        },
        totalExpenses: {
          increment: withdrawal.amount,
        },
      },
    })

    // Update withdrawal status
    return this.prisma.salaryWithdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.APPROVED,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    })
  }

  async reject(id: string, rejectionReason?: string) {
    const withdrawal = await this.findOne(id)

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending')
    }

    return this.prisma.salaryWithdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason,
      },
    })
  }

  async getMyWithdrawals(employeeId: string, employeeType: 'DOCTOR' | 'NURSE') {
    return this.prisma.salaryWithdrawal.findMany({
      where: {
        employeeId,
        employeeType,
      },
      orderBy: { requestedAt: 'desc' },
    })
  }

  async getHospitalAccount() {
    let account = await this.prisma.hospitalAccount.findFirst()
    if (!account) {
      account = await this.prisma.hospitalAccount.create({
        data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
      })
    }

    // Recalculate from actual data to ensure accuracy
    const paidInvoices = await this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID },
      select: { total: true },
    })

    const approvedWithdrawals = await this.prisma.salaryWithdrawal.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      select: { amount: true },
    })

    const calculatedRevenue = paidInvoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.total.toString())
    }, 0)

    const calculatedExpenses = approvedWithdrawals.reduce((sum, w) => {
      return sum + (w.amount || 0)
    }, 0)

    const calculatedBalance = calculatedRevenue - calculatedExpenses

    // Update account with recalculated values
    account = await this.prisma.hospitalAccount.update({
      where: { id: account.id },
      data: {
        totalRevenue: calculatedRevenue,
        totalExpenses: calculatedExpenses,
        balance: calculatedBalance,
      },
    })

    return account
  }

  async updateHospitalBalance(amount: number, isRevenue: boolean = true) {
    let account = await this.prisma.hospitalAccount.findFirst()
    if (!account) {
      account = await this.prisma.hospitalAccount.create({
        data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
      })
    }

    const updateData: any = {
      balance: isRevenue ? { increment: amount } : { decrement: amount },
    }

    if (isRevenue) {
      updateData.totalRevenue = { increment: amount }
    } else {
      updateData.totalExpenses = { increment: amount }
    }

    return this.prisma.hospitalAccount.update({
      where: { id: account.id },
      data: updateData,
    })
  }
}


