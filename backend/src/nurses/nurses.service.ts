import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BedAssignmentStatus } from '@prisma/client';

@Injectable()
export class NursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.nurse.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
        shifts: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.nurse.findUnique({
      where: { id },
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
            isActive: true,
          },
        },
        shifts: true,
        bedAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
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
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.nurse.findUnique({
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
            isActive: true,
          },
        },
        shifts: true,
      },
    });
  }

  async getWorkload(nurseId: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id: nurseId },
      include: { user: true },
    });

    if (!nurse) {
      throw new Error('Nurse not found');
    }

    const [
      assignedPatients,
      activeTasks,
      completedTasks,
      totalNursingNotes,
      todayNursingNotes,
    ] = await Promise.all([
      this.prisma.bedAssignment.count({
        where: {
          nurseId: nurse.id,
          status: 'ACTIVE',
        },
      }),
      this.prisma.task.count({
        where: {
          assignedTo: nurse.userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.task.count({
        where: {
          assignedTo: nurse.userId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.nursingNote.count({
        where: { nurseId: nurse.userId },
      }),
      this.prisma.nursingNote.count({
        where: {
          nurseId: nurse.userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      assignedPatients,
      activeTasks,
      completedTasks,
      totalNursingNotes,
      todayNursingNotes,
    };
  }

  async update(nurseId: string, data: any) {
    try {
      console.log('Updating nurse:', nurseId, 'with data:', JSON.stringify(data, null, 2));
      const { department, licenseNumber, cvData, cvFileName, cvFileType, licenseImage, salary, email, address, ...userData } = data;

      // Prepare nurse update data - only include defined fields
      const nurseUpdateData: any = {};
      if (department !== undefined) nurseUpdateData.department = department || null;
      if (licenseNumber !== undefined) nurseUpdateData.licenseNumber = licenseNumber || null;
      if (cvData !== undefined) nurseUpdateData.cvData = cvData || null;
      if (cvFileName !== undefined) nurseUpdateData.cvFileName = cvFileName || null;
      if (cvFileType !== undefined) nurseUpdateData.cvFileType = cvFileType || null;
      if (licenseImage !== undefined) nurseUpdateData.licenseImage = licenseImage || null;
      if (salary !== undefined) {
        if (salary === '' || salary === null || salary === undefined) {
          nurseUpdateData.salary = null;
        } else {
          const salaryValue = typeof salary === 'number' ? salary : parseFloat(salary);
          nurseUpdateData.salary = isNaN(salaryValue) ? null : salaryValue;
        }
      }

      // Update nurse profile only if there's data to update
      let nurseUpdate;
      if (Object.keys(nurseUpdateData).length > 0) {
        nurseUpdate = await this.prisma.nurse.update({
          where: { id: nurseId },
          data: nurseUpdateData,
        });
      } else {
        // If no nurse data to update, just fetch the nurse
        nurseUpdate = await this.prisma.nurse.findUnique({
          where: { id: nurseId },
        });
        if (!nurseUpdate) {
          throw new Error('Nurse not found');
        }
      }

      // Update user if user data provided
      // Convert dateOfBirth string to Date if provided
      if (userData.dateOfBirth) {
        if (typeof userData.dateOfBirth === 'string' && userData.dateOfBirth !== '') {
          try {
            const date = new Date(userData.dateOfBirth);
            if (!isNaN(date.getTime())) {
              userData.dateOfBirth = date;
            } else {
              delete userData.dateOfBirth;
            }
          } catch (e) {
            delete userData.dateOfBirth;
          }
        }
      }

      // Filter out undefined/null/empty values and fields that shouldn't be updated
      // User model fields: firstName, lastName, phone, dateOfBirth, gender, cnic
      const allowedUserFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'cnic'];
      const cleanUserData = Object.fromEntries(
        Object.entries(userData)
          .filter(([key, v]) => allowedUserFields.includes(key) && v !== undefined && v !== null && v !== '')
      );

      if (Object.keys(cleanUserData).length > 0) {
        await this.prisma.user.update({
          where: { id: nurseUpdate.userId },
          data: cleanUserData,
        });
      }

      return this.findOne(nurseId);
    } catch (error) {
      console.error('Error updating nurse:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      });
      throw error;
    }
  }

  async getAssignedPatients(nurseId: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id: nurseId },
    });

    if (!nurse) {
      throw new Error('Nurse not found');
    }

    const bedAssignments = await this.prisma.bedAssignment.findMany({
      where: {
        nurseId: nurse.id,
        status: BedAssignmentStatus.ACTIVE,
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
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return bedAssignments;
  }
}

