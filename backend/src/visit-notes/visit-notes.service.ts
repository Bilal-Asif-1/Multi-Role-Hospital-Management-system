import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VisitNotesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any) {
    const visitNote = await this.prisma.visitNote.create({
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
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    // Create notification for patient
    try {
      if (visitNote.patient?.userId) {
        await this.notificationsService.create({
          userId: visitNote.patient.userId,
          title: 'New Visit Note',
          message: `Dr. ${visitNote.doctor.user.firstName} ${visitNote.doctor.user.lastName} has added a new visit note for your consultation`,
          type: 'VISIT_NOTE',
          actionUrl: '/patient',
          relatedEntityType: 'VISIT_NOTE',
          relatedEntityId: visitNote.id,
        });
      }
    } catch (error) {
      console.error('Error creating visit note notification:', error);
      // Don't fail visit note creation if notification fails
    }

    return visitNote;
  }

  async findAll(patientId?: string, doctorId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.visitNote.findMany({
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
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.visitNote.findUnique({
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        attachments: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.visitNote.update({
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
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.visitNote.delete({
      where: { id },
    });
  }
}





