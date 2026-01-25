import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LabRecordsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findPatientByUserId(userId: string) {
    return this.prisma.patient.findUnique({
      where: { userId },
    });
  }

  async create(data: any, createdByUserId?: string, createdByRole?: string) {
    try {
      // Handle file attachment if provided (base64 encoded file)
      const { fileData, fileName, fileType, fileSize, ...labData } = data;
      
      // Prepare lab record data - only include valid fields
      const recordData: any = {
        patientId: labData.patientId,
        testName: labData.testName,
        testDate: labData.testDate ? new Date(labData.testDate) : new Date(),
        results: labData.results || null,
        status: labData.status || 'PENDING',
        orderedBy: labData.orderedBy || null,
        notes: labData.notes || null,
      };

      const labRecord = await this.prisma.labRecord.create({
        data: recordData,
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
          attachments: true,
        },
      });

      // If file data is provided, create attachment (store base64 in filePath for now, or use file storage)
      if (fileData && fileName) {
        try {
          // For simplicity, storing base64 data. In production, upload to file storage (S3, etc.)
          await this.prisma.attachment.create({
            data: {
              labRecordId: labRecord.id,
              fileName: fileName,
              filePath: fileData, // Store base64 or upload URL
              fileType: fileType || 'application/octet-stream',
              fileSize: fileSize ? parseInt(fileSize.toString()) : null,
            },
          });
        } catch (attachmentError) {
          console.error('Error creating attachment:', attachmentError);
          // Continue even if attachment creation fails
        }
      }

      // Return updated record with attachments
      const finalRecord = await this.prisma.labRecord.findUnique({
        where: { id: labRecord.id },
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
          attachments: true,
        },
      });

      // Create notifications
      try {
        if (createdByRole === 'PATIENT' && finalRecord.patient?.userId && createdByUserId) {
          // Patient uploaded lab report - notify their doctors from recent appointments
          const recentAppointments = await this.prisma.appointment.findMany({
            where: {
              patientId: createdByUserId,
              status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
            },
            take: 5,
            orderBy: { appointmentDate: 'desc' },
            select: { doctorId: true },
          });

          const uniqueDoctorIds = [...new Set(recentAppointments.map(apt => apt.doctorId))];
          
          for (const doctorId of uniqueDoctorIds) {
            await this.notificationsService.create({
              userId: doctorId,
              title: 'New Lab Report Uploaded',
              message: `${finalRecord.patient.user.firstName} ${finalRecord.patient.user.lastName} uploaded a new lab report: ${labData.testName}`,
              type: 'LAB_RESULT',
              actionUrl: '/doctor',
              relatedEntityType: 'LAB_RECORD',
              relatedEntityId: finalRecord.id,
            });
          }
        } else if (createdByRole && createdByRole !== 'PATIENT' && finalRecord.patient?.userId) {
          // Doctor/Nurse created lab record - notify patient
          await this.notificationsService.create({
            userId: finalRecord.patient.userId,
            title: 'New Lab Report Available',
            message: `A new lab report for ${labData.testName} is now available`,
            type: 'LAB_RESULT',
            actionUrl: '/patient',
            relatedEntityType: 'LAB_RECORD',
            relatedEntityId: finalRecord.id,
          });
        }
      } catch (error) {
        console.error('Error creating lab record notification:', error);
        // Don't fail lab record creation if notification fails
      }

      return finalRecord;
    } catch (error) {
      console.error('Error in lab records service create:', error);
      throw error;
    }
  }

  async findAll(patientId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;

    return this.prisma.labRecord.findMany({
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
        attachments: true,
      },
      orderBy: { testDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.labRecord.findUnique({
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
        attachments: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.labRecord.update({
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
        attachments: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.labRecord.delete({
      where: { id },
    });
  }
}





