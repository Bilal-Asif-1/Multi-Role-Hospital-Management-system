import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, BedAssignmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    if (data.user) {
      const patientData = data.patient || {};
      return this.prisma.$transaction(async (tx) => {
        // Check if user with this email already exists (use findFirst; email is no longer globally unique)
        const existingUser = await tx.user.findFirst({
          where: { email: data.user.email?.trim() },
        });

        if (existingUser) {
          // If user exists and is already a patient, return existing patient
          if (existingUser.role === UserRole.PATIENT) {
            const existingPatient = await tx.patient.findUnique({
              where: { userId: existingUser.id },
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
              },
            });
            if (existingPatient) {
              throw new ConflictException(`A patient with email ${data.user.email} already exists. Please register as returning patient instead.`);
            }
          }
          // If user exists with different role, throw error
          throw new ConflictException(`An account with email ${data.user.email} already exists with role ${existingUser.role}. Please use a different email.`);
        }

        const hashedPassword = await bcrypt.hash(data.user.password, 10);
        const phoneNormalized = data.user.phone ? String(data.user.phone).replace(/\D/g, '').trim() || null : null;
        const user = await tx.user.create({
          data: {
            email: data.user.email.trim(),
            password: hashedPassword,
            firstName: data.user.firstName.trim(),
            lastName: data.user.lastName.trim(),
            phone: phoneNormalized,
            cnic: data.user.cnic?.trim() || null,
            role: UserRole.PATIENT,
            isApproved: true, // Walk-in patients are auto-approved
          },
        });

        // Clean patient data - remove null/undefined and convert empty strings to null
        const cleanPatientData: any = {};
        if (patientData.gender) cleanPatientData.gender = patientData.gender;
        if (patientData.dateOfBirth) cleanPatientData.dateOfBirth = new Date(patientData.dateOfBirth);
        if (patientData.cnic) cleanPatientData.cnic = patientData.cnic.trim() || null;
        if (patientData.bloodGroup) cleanPatientData.bloodGroup = patientData.bloodGroup.trim() || null;
        if (patientData.allergies) cleanPatientData.allergies = patientData.allergies.trim() || null;
        if (patientData.medicalHistory) cleanPatientData.medicalHistory = patientData.medicalHistory.trim() || null;
        cleanPatientData.currentState = patientData.currentState || 'IN_APPOINTMENT';
        if (patientData.departmentId) cleanPatientData.departmentId = patientData.departmentId;
        // Sync from user when not in patient payload (e.g. walk-in sends cnic on user)
        if (!cleanPatientData.cnic && data.user?.cnic) cleanPatientData.cnic = data.user.cnic.trim() || null;

        const patient = await tx.patient.create({
          data: {
            ...cleanPatientData,
            userId: user.id,
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
          },
        });

        return patient;
      });
    }

    return this.prisma.patient.create({
      data,
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
      },
    });
  }

  async findAll(search?: string) {
    try {
      const searchTrimmed = search?.trim()
      const searchDigits = searchTrimmed?.replace(/\D/g, '') ?? ''
      const orConditions: Prisma.UserWhereInput[] = []
      if (searchTrimmed) {
        orConditions.push(
          { firstName: { contains: searchTrimmed, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: searchTrimmed, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: searchTrimmed, mode: Prisma.QueryMode.insensitive } },
        )
        if (searchDigits.length >= 5) {
          const likePattern = `%${searchDigits}%`
          const phoneUsers = await this.prisma.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT id FROM users WHERE phone IS NOT NULL AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE ${likePattern}`,
          )
          const phoneUserIds = phoneUsers.map((r) => r.id)
          if (phoneUserIds.length > 0) {
            orConditions.push({ id: { in: phoneUserIds } })
          }
        }
      }
      const where: Prisma.PatientWhereInput = {
        user: {
          ...(orConditions.length ? { OR: orConditions } : {}),
        },
      };
      return await this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              gender: true,
              cnic: true,
              dateOfBirth: true,
              isApproved: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            cnic: true,
            dateOfBirth: true,
          },
        },
        visitNotes: {
          include: {
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
          },
          orderBy: { visitDate: 'desc' },
        },
        labRecords: {
          orderBy: { testDate: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { prescribedDate: 'desc' },
        },
      },
    });
  }

  async getOverview(id: string) {
    const patient = await this.findOne(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const [appointments, bedAssignments, stateLogs, latestVitals] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: patient.userId },
        include: {
          doctor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.bedAssignment.findMany({
        where: { patientId: patient.id },
        include: {
          bed: {
            include: {
              room: true,
            },
          },
          doctor: {
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
          nurse: {
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
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.patientStateLog.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.vitals.findMany({
        where: { patientId: patient.id },
        orderBy: { recordedAt: 'desc' },
        take: 1,
      }),
    ]);

    const currentBedAssignment = bedAssignments.find(
      (assignment) => assignment.status === BedAssignmentStatus.ACTIVE,
    );

    const normalizeDoctor = (doctor?: any) => {
      if (!doctor) return null;
      if (doctor.user) {
        return {
          id: doctor.id,
          firstName: doctor.user.firstName,
          lastName: doctor.user.lastName,
          email: doctor.user.email,
        };
      }
      return {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
      };
    };

    const assignedDoctor =
      currentBedAssignment?.doctor ||
      appointments.find((apt) => apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')?.doctor;

    const assignedNurse = currentBedAssignment?.nurse;

    return {
      patient,
      appointments,
      admissions: bedAssignments,
      stateLogs,
      latestVitals: latestVitals[0] || null,
      currentAssignment: currentBedAssignment || null,
      assignedDoctor: normalizeDoctor(assignedDoctor),
      assignedNurse: assignedNurse
        ? {
            id: assignedNurse.id,
            firstName: assignedNurse.user?.firstName,
            lastName: assignedNurse.user?.lastName,
            email: assignedNurse.user?.email,
          }
        : null,
    };
  }

  async findByUserId(userId: string) {
    return this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            cnic: true,
            dateOfBirth: true,
          },
        },
      },
    });
  }

  async updateByUserId(userId: string, data: any) {
    // Separate user data and patient data, and filter out password fields
    const { 
      firstName, 
      lastName, 
      phone, 
      currentPassword, 
      newPassword, 
      confirmPassword,
      email, // Don't allow email update here
      ...patientData 
    } = data;
    
    // Update patient data
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Update user if user data is provided
    if (firstName || lastName || phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    // Prepare patient data for update
    const updateData: any = {};
    
    // Handle dateOfBirth conversion
    if (patientData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = patientData.dateOfBirth 
        ? new Date(patientData.dateOfBirth) 
        : null;
    }
    
    // Handle other fields - convert empty strings to null
    const fieldsToUpdate = [
      'gender', 
      'cnic', 
      'address', 
      'bloodGroup', 
      'allergies', 
      'medicalHistory',
      'emergencyContact',
      'emergencyPhone'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (patientData[field] !== undefined) {
        updateData[field] = patientData[field] === '' ? null : patientData[field];
      }
    });

    // Update patient data
    return this.prisma.patient.update({
      where: { id: patient.id },
      data: updateData,
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
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    }
    return this.prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            cnic: true,
            dateOfBirth: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Get patient to access userId for user deletion
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Delete patient and related records in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Delete patient first (this will cascade delete related records with onDelete: Cascade)
      await tx.patient.delete({
        where: { id },
      });

      // Notification and Task reference User without onDelete Cascade, so delete them first
      await tx.notification.deleteMany({ where: { userId: patient.userId } });
      await tx.task.deleteMany({
        where: { OR: [{ assignedTo: patient.userId }, { assignedBy: patient.userId }] },
      });

      // Delete the associated user (this will cascade delete appointments and other user-related records)
      await tx.user.delete({
        where: { id: patient.userId },
      });

      return { success: true };
    });
  }
}

