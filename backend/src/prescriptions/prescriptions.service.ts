import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findPatientByUserId(userId: string) {
    return this.prisma.patient.findUnique({
      where: { userId },
    });
  }

  async create(data: any) {
    const prescription = await this.prisma.prescription.create({
      data,
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for patient
    try {
      if (prescription.patient?.userId) {
        await this.notificationsService.create({
          userId: prescription.patient.userId,
          title: 'New Prescription',
          message: `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName} has prescribed new medication for you`,
          type: 'PRESCRIPTION',
          actionUrl: '/patient',
          relatedEntityType: 'PRESCRIPTION',
          relatedEntityId: prescription.id,
        });
      }
    } catch (error) {
      console.error('Error creating prescription notification:', error);
      // Don't fail prescription creation if notification fails
    }

    return prescription;
  }

  async findAll(patientId?: string, doctorId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.prescription.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
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
      orderBy: { prescribedDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.prescription.update({
      where: { id },
      data,
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
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

  async remove(id: string) {
    return this.prisma.prescription.delete({
      where: { id },
    });
  }
}





