import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDoctorShiftDto, CreateNurseShiftDto, UpdateShiftStatusDto } from './dto/create-shift.dto'

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  getDoctorShifts(doctorId: string) {
    return this.prisma.doctorShift.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  getNurseShifts(nurseId: string) {
    return this.prisma.nurseShift.findMany({
      where: { nurseId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  createDoctorShift(dto: CreateDoctorShiftDto) {
    return this.prisma.doctorShift.create({
      data: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status ?? 'ACTIVE',
        location: dto.location,
      },
    })
  }

  createNurseShift(dto: CreateNurseShiftDto) {
    return this.prisma.nurseShift.create({
      data: {
        nurseId: dto.nurseId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        ward: dto.ward,
        status: dto.status ?? 'ACTIVE',
      },
    })
  }

  async updateDoctorShiftStatus(id: string, dto: UpdateShiftStatusDto) {
    await this.ensureDoctorShift(id)
    return this.prisma.doctorShift.update({
      where: { id },
      data: { status: dto.status },
    })
  }

  async updateNurseShiftStatus(id: string, dto: UpdateShiftStatusDto) {
    await this.ensureNurseShift(id)
    return this.prisma.nurseShift.update({
      where: { id },
      data: { status: dto.status },
    })
  }

  async deleteDoctorShift(id: string) {
    await this.ensureDoctorShift(id)
    return this.prisma.doctorShift.delete({ where: { id } })
  }

  async deleteNurseShift(id: string) {
    await this.ensureNurseShift(id)
    return this.prisma.nurseShift.delete({ where: { id } })
  }

  private async ensureDoctorShift(id: string) {
    const shift = await this.prisma.doctorShift.findUnique({ where: { id } })
    if (!shift) {
      throw new NotFoundException('Doctor shift not found')
    }
  }

  private async ensureNurseShift(id: string) {
    const shift = await this.prisma.nurseShift.findUnique({ where: { id } })
    if (!shift) {
      throw new NotFoundException('Nurse shift not found')
    }
  }
}

