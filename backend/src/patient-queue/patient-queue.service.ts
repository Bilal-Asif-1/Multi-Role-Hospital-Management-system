import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientQueueService {
  constructor(private prisma: PrismaService) {}

  async checkIn(data: {
    patientId: string;
    appointmentId?: string;
    doctorId?: string;
    priority?: string;
    notes?: string;
  }) {
    return this.prisma.patientQueue.create({
      data: {
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        priority: data.priority || 'NORMAL',
        notes: data.notes,
        status: 'WAITING',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(status?: string, doctorId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.patientQueue.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { checkedInAt: 'asc' },
      ],
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.patientQueue.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.patientQueue.delete({
      where: { id },
    });
  }
}



