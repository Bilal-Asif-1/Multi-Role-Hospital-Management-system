import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class SalariesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: {
    employeeId: string
    employeeType: 'DOCTOR' | 'NURSE'
    periodStart: Date
    periodEnd: Date
    baseSalary: number
    appointmentEarnings?: number
    appointmentShares?: any[]
    totalSalary: number
  }) {
    let userId: string | null = null
    
    // Verify employee exists and get userId
    if (data.employeeType === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({ 
        where: { id: data.employeeId },
        select: { userId: true },
      })
      if (!doctor) {
        throw new NotFoundException('Doctor not found')
      }
      userId = doctor.userId
    } else {
      const nurse = await this.prisma.nurse.findUnique({ 
        where: { id: data.employeeId },
        select: { userId: true },
      })
      if (!nurse) {
        throw new NotFoundException('Nurse not found')
      }
      userId = nurse.userId
    }

    // Create salary record
    const salary = await this.prisma.salary.create({
      data: {
        employeeId: data.employeeId,
        employeeType: data.employeeType,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        baseSalary: data.baseSalary,
        appointmentEarnings: data.appointmentEarnings || 0,
        appointmentShares: data.appointmentShares || null,
        totalSalary: data.totalSalary,
      },
    })

    // Create notification for employee
    try {
      if (userId) {
        const periodStartStr = new Date(data.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const periodEndStr = new Date(data.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        await this.notificationsService.create({
          userId,
          title: 'Salary Processed',
          message: `Your salary for the period ${periodStartStr} - ${periodEndStr} has been processed. Total: $${data.totalSalary.toFixed(2)}`,
          type: 'SALARY',
          actionUrl: data.employeeType === 'DOCTOR' ? '/doctor/salary' : '/nurse/salary',
          relatedEntityType: 'SALARY',
          relatedEntityId: salary.id,
        })
      }
    } catch (error) {
      console.error('Error creating salary notification:', error)
      // Don't fail salary creation if notification fails
    }

    return salary
  }

  async findAll(filters?: { employeeId?: string; employeeType?: 'DOCTOR' | 'NURSE'; includeDeleted?: boolean }) {
    const where: any = {}
    
    if (filters?.employeeId) where.employeeId = filters.employeeId
    if (filters?.employeeType) where.employeeType = filters.employeeType
    if (filters?.includeDeleted !== true) {
      where.isDeleted = false
    }

    return this.prisma.salary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id },
    })

    if (!salary) {
      throw new NotFoundException('Salary not found')
    }

    return salary
  }

  async delete(id: string) {
    const salary = await this.findOne(id)

    if (salary.isDeleted) {
      throw new BadRequestException('Salary already deleted')
    }

    return this.prisma.salary.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })
  }

  async getEmployeeSalaries(employeeId: string, employeeType: 'DOCTOR' | 'NURSE') {
    return this.prisma.salary.findMany({
      where: {
        employeeId,
        employeeType,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}


