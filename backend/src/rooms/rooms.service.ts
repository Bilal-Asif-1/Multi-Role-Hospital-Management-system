import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AssignBedDto, CreateRoomDto, CreateBedDto, HousekeepingLogDto, ReleaseBedDto, UpdateRoomStatusDto, UpdateRoomDto } from './dto/create-room.dto'
import { BedStatus, BedAssignmentStatus, RoomStatus } from '@prisma/client'

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRooms() {
    // Auto-release beds that have been assigned for more than 24 hours
    await this.autoReleaseExpiredBeds()

    return this.prisma.room.findMany({
      include: {
        beds: true,
      },
      orderBy: { roomNumber: 'asc' },
    })
  }

  private async autoReleaseExpiredBeds() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find all active bed assignments older than 24 hours
    const expiredAssignments = await this.prisma.bedAssignment.findMany({
      where: {
        status: BedAssignmentStatus.ACTIVE,
        assignedAt: {
          lt: twentyFourHoursAgo,
        },
      },
      include: {
        bed: {
          select: { roomId: true },
        },
      },
    })

    if (expiredAssignments.length === 0) {
      return
    }

    // Release expired beds in batches
    for (const assignment of expiredAssignments) {
      await this.prisma.$transaction(async (tx) => {
        // Update assignment status to COMPLETED
        await tx.bedAssignment.update({
          where: { id: assignment.id },
          data: {
            status: BedAssignmentStatus.COMPLETED,
            releasedAt: new Date(),
            notes: (assignment.notes || '') + ' [Auto-released after 24 hours]',
          },
        })

        // Update bed status directly to AVAILABLE (skip CLEANING for auto-release)
        await tx.bed.update({
          where: { id: assignment.bedId },
          data: { status: BedStatus.AVAILABLE },
        })

        // Update room status if no beds are occupied
        if (assignment.bed?.roomId) {
          const occupiedBeds = await tx.bed.count({
            where: {
              roomId: assignment.bed.roomId,
              status: BedStatus.OCCUPIED,
            },
          })

          if (occupiedBeds === 0) {
            await tx.room.update({
              where: { id: assignment.bed.roomId },
              data: { status: RoomStatus.AVAILABLE },
            })
          }
        }
      })
    }
  }

  async getRoomById(id: string) {
    // Auto-release beds before fetching room details
    await this.autoReleaseExpiredBeds()

    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        beds: {
          include: {
            assignments: {
              where: { status: BedAssignmentStatus.ACTIVE },
              include: { patient: true },
            },
          },
        },
      },
    })

    if (!room) {
      throw new NotFoundException('Room not found')
    }

    return room
  }

  async createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        roomNumber: dto.roomNumber,
        name: dto.name,
        type: dto.type,
        floor: dto.floor,
        capacity: dto.capacity ?? 0,
        status: dto.status ?? RoomStatus.AVAILABLE,
        notes: dto.notes,
        // Don't create beds initially - user will add them later
      },
      include: { beds: true },
    })
  }

  async updateRoomStatus(id: string, dto: UpdateRoomStatusDto) {
    await this.getRoomById(id)

    return this.prisma.room.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
      },
    })
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    await this.getRoomById(id)

    return this.prisma.room.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        floor: dto.floor,
        notes: dto.notes,
      },
      include: { beds: true },
    })
  }

  async getBedsForRoom(roomId: string) {
    await this.getRoomById(roomId)

    return this.prisma.bed.findMany({
      where: { roomId },
      include: {
        assignments: {
          where: { status: BedAssignmentStatus.ACTIVE },
          include: { patient: true, doctor: true, nurse: true },
        },
      },
      orderBy: { label: 'asc' },
    })
  }

  async assignBed(dto: AssignBedDto) {
    const room = await this.getRoomById(dto.roomId)

    // ensure patient not already assigned
    const activeAssignment = await this.prisma.bedAssignment.findFirst({
      where: {
        patientId: dto.patientId,
        status: BedAssignmentStatus.ACTIVE,
      },
    })

    if (activeAssignment) {
      throw new BadRequestException('Patient already has an active bed assignment')
    }

    let bedId = dto.bedId

    if (!bedId) {
      const availableBed = room.beds.find((bed) => bed.status === BedStatus.AVAILABLE)
      if (!availableBed) {
        throw new BadRequestException('No available beds in this room')
      }
      bedId = availableBed.id
    } else {
      const bed = room.beds.find((b) => b.id === bedId)
      if (!bed) {
        throw new NotFoundException('Bed not found in this room')
      }
      // Check if bed is available (after auto-release, expired beds should be AVAILABLE)
      if (bed.status !== BedStatus.AVAILABLE && bed.status !== BedStatus.CLEANING) {
        throw new BadRequestException('Selected bed is not available')
      }
      // If bed is in CLEANING status, make it AVAILABLE for new assignment
      if (bed.status === BedStatus.CLEANING) {
        await this.prisma.bed.update({
          where: { id: bedId },
          data: { status: BedStatus.AVAILABLE },
        })
      }
    }

    // Convert doctorId from User.id to Doctor.id if provided
    let doctorIdForAssignment = dto.doctorId
    if (doctorIdForAssignment) {
      // Check if it's a User.id (from appointments) and convert to Doctor.id
      const doctorByUserId = await this.prisma.doctor.findUnique({
        where: { userId: doctorIdForAssignment },
        select: { id: true },
      })
      if (doctorByUserId) {
        doctorIdForAssignment = doctorByUserId.id
      } else {
        // If not found by userId, assume it's already Doctor.id
        // Verify it exists
        const doctorById = await this.prisma.doctor.findUnique({
          where: { id: doctorIdForAssignment },
          select: { id: true },
        })
        if (!doctorById) {
          // Invalid doctorId, set to null (optional field)
          doctorIdForAssignment = undefined
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.OCCUPIED },
      })

      // mark room as occupied if all beds taken
      const availableBeds = await tx.bed.count({
        where: { roomId: dto.roomId, status: BedStatus.AVAILABLE },
      })

      if (availableBeds === 0 && room.status !== RoomStatus.OCCUPIED) {
        await tx.room.update({
          where: { id: dto.roomId },
          data: { status: RoomStatus.OCCUPIED },
        })
      }

      return tx.bedAssignment.create({
        data: {
          bedId,
          patientId: dto.patientId,
          doctorId: doctorIdForAssignment,
          nurseId: dto.nurseId,
          notes: dto.notes,
        },
        include: {
          bed: true,
          patient: true,
        },
      })
    })
  }

  async releaseBed(dto: ReleaseBedDto) {
    let assignment = null

    if (dto.assignmentId) {
      assignment = await this.prisma.bedAssignment.findUnique({
        where: { id: dto.assignmentId },
      })
    } else if (dto.bedId) {
      assignment = await this.prisma.bedAssignment.findFirst({
        where: { bedId: dto.bedId, status: BedAssignmentStatus.ACTIVE },
      })
    }

    if (!assignment) {
      throw new NotFoundException('Active bed assignment not found')
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bedAssignment.update({
        where: { id: assignment.id },
        data: {
          status: BedAssignmentStatus.COMPLETED,
          releasedAt: new Date(),
          notes: dto.notes,
        },
      })

      const updatedBed = await tx.bed.update({
        where: { id: assignment.bedId },
        data: { status: BedStatus.CLEANING },
      })

      // if room was occupied and at least one bed freed, mark as available
      const occupiedBeds = await tx.bed.count({
        where: { roomId: updatedBed.roomId, status: BedStatus.OCCUPIED },
      })

      if (occupiedBeds === 0) {
        await tx.room.update({
          where: { id: updatedBed.roomId },
          data: { status: RoomStatus.AVAILABLE },
        })
      }

      return updatedBed
    })
  }

  async logHousekeeping(roomId: string, dto: HousekeepingLogDto) {
    await this.getRoomById(roomId)

    return this.prisma.roomHousekeepingLog.create({
      data: {
        roomId,
        status: dto.status,
        notes: dto.notes,
        completedAt: dto.completedAt,
      },
    })
  }

  async getOccupancyHistory(roomId: string) {
    await this.getRoomById(roomId)

    return this.prisma.bedAssignment.findMany({
      where: { bed: { roomId } },
      orderBy: { assignedAt: 'desc' },
      include: {
        bed: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
    })
  }

  async createBed(roomId: string, dto: CreateBedDto) {
    const room = await this.getRoomById(roomId)

    // Check if bed with same label already exists in this room
    const existingBed = await this.prisma.bed.findFirst({
      where: {
        roomId,
        label: dto.label,
      },
    })

    if (existingBed) {
      throw new BadRequestException(`Bed with label "${dto.label}" already exists in this room`)
    }

    const bed = await this.prisma.bed.create({
      data: {
        roomId,
        label: dto.label,
        status: BedStatus.AVAILABLE,
      },
    })

    // Update room capacity
    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        capacity: room.capacity + 1,
      },
    })

    return bed
  }

  async deleteBed(bedId: string) {
    const bed = await this.prisma.bed.findUnique({
      where: { id: bedId },
      include: {
        assignments: {
          where: { status: BedAssignmentStatus.ACTIVE },
        },
      },
    })

    if (!bed) {
      throw new NotFoundException('Bed not found')
    }

    // Check if bed has active assignments
    if (bed.assignments && bed.assignments.length > 0) {
      throw new BadRequestException('Cannot delete bed with active assignments. Please release the bed first.')
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete the bed
      await tx.bed.delete({
        where: { id: bedId },
      })

      // Update room capacity
      const room = await tx.room.findUnique({
        where: { id: bed.roomId },
      })

      if (room) {
        await tx.room.update({
          where: { id: bed.roomId },
          data: {
            capacity: Math.max(0, room.capacity - 1),
          },
        })
      }

      return { success: true }
    })
  }
}

