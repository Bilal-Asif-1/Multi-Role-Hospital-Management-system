import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            cnic: true,
          },
        },
        availability: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            cnic: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        availability: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            cnic: true,
          },
        },
        availability: true,
      },
    });
  }

  async createDoctorProfile(userId: string) {
    // Check if user exists and is a doctor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'DOCTOR') {
      throw new Error('User is not a doctor');
    }

    // Create doctor profile if it doesn't exist
    try {
      return await this.prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: null,
          licenseNumber: null,
          department: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              cnic: true,
            },
          },
          availability: true,
        },
      });
    } catch (error: any) {
      // If profile already exists (race condition), fetch it
      if (error.code === 'P2002') {
        return this.findByUserId(userId);
      }
      throw error;
    }
  }

  async updateAvailability(doctorId: string, availability: any[]) {
    // Delete existing availability
    await this.prisma.doctorAvailability.deleteMany({
      where: { doctorId },
    });

    // Create new availability
    return this.prisma.doctorAvailability.createMany({
      data: availability.map((avail) => ({
        doctorId,
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
        isAvailable: avail.isAvailable ?? true,
      })),
    });
  }

  async getAvailability(doctorId: string) {
    return this.prisma.doctorAvailability.findMany({
      where: { doctorId },
    });
  }

  async findAvailableDoctors(params: { specialization?: string; start?: string; end?: string }) {
    const { specialization, start, end } = params;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const dayOfWeek = startDate ? startDate.getDay() : undefined;
    const toTimeString = (date?: Date) =>
      date
        ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        : undefined;
    const startTime = toTimeString(startDate);
    const endTime = toTimeString(endDate) || startTime;

    const doctors = await this.prisma.doctor.findMany({
      where: {
        ...(specialization
          ? {
              specialization: {
                contains: specialization,
                mode: 'insensitive',
              },
            }
          : {}),
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        availability:
          dayOfWeek !== undefined
            ? {
                where: {
                  dayOfWeek,
                  isAvailable: true,
                },
              }
            : true,
      },
    });

    if (!startDate || dayOfWeek === undefined || !startTime) {
      return doctors;
    }

    const doctorUserIds = doctors.map((doctor) => doctor.userId);
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflicts = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorUserIds },
        appointmentDate: { gte: dayStart, lte: dayEnd },
        appointmentTime: startTime,
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      select: { doctorId: true },
    });

    const conflictSet = new Set(conflicts.map((c) => c.doctorId));

    return doctors.filter((doctor) => {
      const hasSlot =
        doctor.availability && doctor.availability.length > 0
          ? doctor.availability.some(
              (slot) => slot.startTime <= startTime && (endTime ? slot.endTime >= endTime : true),
            )
          : false;

      if (!hasSlot) return false;

      if (conflictSet.has(doctor.userId)) return false;

      return true;
    });
  }

  async getWorkload(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      activePatients,
      totalPrescriptions,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { doctorId: doctor.userId },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.userId,
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.userId,
          appointmentDate: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.userId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.bedAssignment.count({
        where: {
          doctorId: doctor.id,
          status: 'ACTIVE',
        },
      }),
      this.prisma.prescription.count({
        where: { doctorId: doctor.userId },
      }),
    ]);

    return {
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      activePatients,
      totalPrescriptions,
    };
  }

  async update(doctorId: string, data: any) {
    const { specialization, department, licenseNumber, bio, cvData, cvFileName, cvFileType, licenseImage, appointmentFees, salary, ...userData } = data;

    // Update doctor profile
    const doctorUpdate = await this.prisma.doctor.update({
      where: { id: doctorId },
      data: {
        specialization,
        department,
        licenseNumber,
        bio,
        cvData,
        cvFileName,
        cvFileType,
        licenseImage,
        appointmentFees: appointmentFees !== undefined && appointmentFees !== null ? parseFloat(appointmentFees) : null,
        salary: salary !== undefined && salary !== null ? parseFloat(salary) : null,
      },
    });

    // Update user if user data provided
    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: doctorUpdate.userId },
        data: userData,
      });
    }

    return this.findOne(doctorId);
  }

  async getAssignedPatients(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const [appointments, bedAssignments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.userId,
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        },
        // Appointment.patient is a User relation, not Patient model
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { appointmentDate: 'asc' },
      }),
      this.prisma.bedAssignment.findMany({
        where: {
          doctorId: doctor.id,
          status: 'ACTIVE',
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          bed: {
            include: {
              room: true,
            },
          },
        },
      }),
    ]);

    return {
      appointments,
      bedAssignments,
    };
  }
}





