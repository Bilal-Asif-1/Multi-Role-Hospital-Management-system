import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDepartmentDto, UpdateDepartmentDto, AssignRoomDto, AssignDoctorDto, AssignNurseDto } from './dto/create-department.dto'
import { BedAssignmentStatus } from '@prisma/client'

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.department.findMany({
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        doctors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        nurses: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async getById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                assignments: {
                  where: { status: BedAssignmentStatus.ACTIVE },
                  include: {
                    patient: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        doctors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        nurses: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!department) {
      throw new NotFoundException('Department not found')
    }

    return department
  }

  async create(dto: CreateDepartmentDto) {
    // Check if department with same name exists
    const existing = await this.prisma.department.findUnique({
      where: { name: dto.name },
    })

    if (existing) {
      throw new BadRequestException('Department with this name already exists')
    }

    return this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description,
        headDoctorId: dto.headDoctorId,
      },
      include: {
        rooms: true,
        doctors: true,
        nurses: true,
      },
    })
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.getById(id)

    // Check name uniqueness if name is being updated
    if (dto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      })

      if (existing) {
        throw new BadRequestException('Department with this name already exists')
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        headDoctorId: dto.headDoctorId,
      },
      include: {
        rooms: true,
        doctors: true,
        nurses: true,
      },
    })
  }

  async delete(id: string) {
    await this.getById(id)

    // Check if department has rooms, doctors, or nurses
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        rooms: true,
        doctors: true,
        nurses: true,
      },
    })

    if (department && (department.rooms.length > 0 || department.doctors.length > 0 || department.nurses.length > 0)) {
      throw new BadRequestException(
        'Cannot delete department with assigned rooms, doctors, or nurses. Please reassign them first.',
      )
    }

    return this.prisma.department.delete({
      where: { id },
    })
  }

  async assignRoom(departmentId: string, dto: AssignRoomDto) {
    await this.getById(departmentId)

    // Check if room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    })

    if (!room) {
      throw new NotFoundException('Room not found')
    }

    // Check if room is already assigned to another department
    if (room.departmentId && room.departmentId !== departmentId) {
      throw new BadRequestException('Room is already assigned to another department')
    }

    return this.prisma.room.update({
      where: { id: dto.roomId },
      data: {
        departmentId,
      },
      include: {
        department: true,
        beds: true,
      },
    })
  }

  async removeRoom(departmentId: string, roomId: string) {
    await this.getById(departmentId)

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      throw new NotFoundException('Room not found')
    }

    if (room.departmentId !== departmentId) {
      throw new BadRequestException('Room is not assigned to this department')
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        departmentId: null,
      },
      include: {
        department: true,
        beds: true,
      },
    })
  }

  async getAvailableRooms() {
    return this.prisma.room.findMany({
      where: {
        departmentId: null,
      },
      include: {
        beds: true,
      },
      orderBy: { roomNumber: 'asc' },
    })
  }

  async assignDoctor(departmentId: string, dto: AssignDoctorDto) {
    const dept = await this.getById(departmentId)

    // Check if doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    })

    if (!doctor) {
      throw new NotFoundException('Doctor not found')
    }
    
    return this.prisma.doctor.update({
      where: { id: dto.doctorId },
      data: {
        departmentId,
        department: dept.name, // Also update legacy field for backward compatibility
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  async removeDoctor(departmentId: string, doctorId: string) {
    await this.getById(departmentId)

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    })

    if (!doctor) {
      throw new NotFoundException('Doctor not found')
    }

    if (doctor.departmentId !== departmentId) {
      throw new BadRequestException('Doctor is not assigned to this department')
    }

    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: {
        departmentId: null,
        department: null,
      },
    })
  }

  async assignNurse(departmentId: string, dto: AssignNurseDto) {
    const dept = await this.getById(departmentId)

    // Check if nurse exists
    const nurse = await this.prisma.nurse.findUnique({
      where: { id: dto.nurseId },
    })

    if (!nurse) {
      throw new NotFoundException('Nurse not found')
    }

    return this.prisma.nurse.update({
      where: { id: dto.nurseId },
      data: {
        departmentId,
        department: dept.name, // Also update legacy field for backward compatibility
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  async removeNurse(departmentId: string, nurseId: string) {
    await this.getById(departmentId)

    const nurse = await this.prisma.nurse.findUnique({
      where: { id: nurseId },
    })

    if (!nurse) {
      throw new NotFoundException('Nurse not found')
    }

    if (nurse.departmentId !== departmentId) {
      throw new BadRequestException('Nurse is not assigned to this department')
    }

    return this.prisma.nurse.update({
      where: { id: nurseId },
      data: {
        departmentId: null,
        department: null,
      },
    })
  }

  async getAvailableDoctors() {
    return this.prisma.doctor.findMany({
      where: {
        departmentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    })
  }

  async getAvailableNurses() {
    return this.prisma.nurse.findMany({
      where: {
        departmentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    })
  }
}

