import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BedAssignmentStatus } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logActivity(data: {
    userId?: string;
    userEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: any;
    metadata?: any;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          description: data.description,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  async getActivityLogs(filters?: {
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async getRelatedEntities(entityType: string, entityId: string) {
    const relations: any[] = [];

    switch (entityType.toLowerCase()) {
      case 'patient':
        const patient = await this.prisma.patient.findUnique({
          where: { id: entityId },
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
            bedAssignments: {
              where: { status: BedAssignmentStatus.ACTIVE },
              include: {
                bed: { include: { room: true } },
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
            },
          },
        });

        // Get appointments separately - Appointment model uses User IDs, not Doctor IDs
        const patientAppointments = await this.prisma.appointment.findMany({
          where: { patientId: entityId },
          take: 5,
        });

        if (patient) {
          if (patient.bedAssignments.length > 0) {
            relations.push({
              type: 'Room',
              label: 'Assigned Room',
              items: patient.bedAssignments.map((a: any) => ({
                id: a.bed.room.id,
                name: `Room ${a.bed.room.roomNumber}`,
                type: 'Room',
              })),
            });
          }
          if (patient.bedAssignments.some((a: any) => a.doctor)) {
            relations.push({
              type: 'Doctor',
              label: 'Assigned Doctor',
              items: patient.bedAssignments
                .filter((a: any) => a.doctor)
                .map((a: any) => ({
                  id: a.doctor.id,
                  name: `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}`,
                  type: 'Doctor',
                })),
            });
          }
          if (patient.bedAssignments.some((a: any) => a.nurse)) {
            relations.push({
              type: 'Nurse',
              label: 'Assigned Nurse',
              items: patient.bedAssignments
                .filter((a: any) => a.nurse)
                .map((a: any) => ({
                  id: a.nurse.id,
                  name: `${a.nurse.user.firstName} ${a.nurse.user.lastName}`,
                  type: 'Nurse',
                })),
            });
          }
          if (patientAppointments.length > 0) {
            relations.push({
              type: 'Appointment',
              label: 'Appointments',
              items: patientAppointments.map((apt: any) => ({
                id: apt.id,
                name: `Appointment - ${apt.appointmentDate}`,
                type: 'Appointment',
              })),
            });
          }
        }
        break;

      case 'doctor':
        const doctor = await this.prisma.doctor.findUnique({
          where: { id: entityId },
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
            bedAssignments: {
              where: { status: BedAssignmentStatus.ACTIVE },
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
              },
            },
          },
        });

        if (doctor) {
          if (doctor.bedAssignments.length > 0) {
            relations.push({
              type: 'Patient',
              label: 'Assigned Patients',
              items: doctor.bedAssignments.map((a: any) => ({
                id: a.patient.id,
                name: `${a.patient.user.firstName} ${a.patient.user.lastName}`,
                type: 'Patient',
              })),
            });
          }
        }
        break;

      case 'nurse':
        const nurse = await this.prisma.nurse.findUnique({
          where: { id: entityId },
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
            bedAssignments: {
              where: { status: BedAssignmentStatus.ACTIVE },
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
              },
            },
          },
        });

        if (nurse) {
          if (nurse.bedAssignments.length > 0) {
            relations.push({
              type: 'Patient',
              label: 'Assigned Patients',
              items: nurse.bedAssignments.map((a: any) => ({
                id: a.patient.id,
                name: `${a.patient.user.firstName} ${a.patient.user.lastName}`,
                type: 'Patient',
              })),
            });
          }
        }
        break;

      case 'room':
        const room = await this.prisma.room.findUnique({
          where: { id: entityId },
          include: {
            beds: {
              include: {
                assignments: {
                  where: { status: BedAssignmentStatus.ACTIVE },
                  include: {
                    patient: { include: { user: true } },
                    doctor: { include: { user: true } },
                    nurse: { include: { user: true } },
                  },
                },
              },
            },
          },
        });

        if (room) {
          const assignedPatients = room.beds
            .flatMap((bed) => bed.assignments)
            .map((a: any) => ({
              id: a.patient.id,
              name: `${a.patient.user.firstName} ${a.patient.user.lastName}`,
              type: 'Patient',
            }));

          if (assignedPatients.length > 0) {
            relations.push({
              type: 'Patient',
              label: 'Occupied By',
              items: assignedPatients,
            });
          }
        }
        break;
    }

    return relations;
  }

  async getCriticalAlerts() {
    const alerts: any[] = [];
    const now = new Date();

    // Check for overlapping shifts
    const allShifts = await this.prisma.$queryRaw`
      SELECT ds.id, ds."doctorId", ds."dayOfWeek", ds."startTime", ds."endTime", 
             d."userId" as doctor_user_id
      FROM "doctor_shifts" ds
      JOIN "doctors" d ON ds."doctorId" = d.id
      WHERE ds.status = 'ACTIVE'
    `;

    // Check for capacity issues
    const rooms = await this.prisma.room.findMany({
      include: {
        beds: true,
      },
    });

    rooms.forEach((room) => {
      const occupiedBeds = room.beds.filter((bed) => bed.status === 'OCCUPIED').length;
      const capacity = room.capacity;
      const utilization = (occupiedBeds / capacity) * 100;

      if (utilization >= 95) {
        alerts.push({
          type: 'CAPACITY',
          severity: 'HIGH',
          message: `Room ${room.roomNumber} is at ${utilization.toFixed(0)}% capacity`,
          entityType: 'Room',
          entityId: room.id,
        });
      }
    });

    // Check for patients in waiting state for too long
    const waitingPatients = await this.prisma.patient.findMany({
      where: {
        currentState: 'WAITING',
        createdAt: {
          lt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      },
      include: { user: true },
    });

    waitingPatients.forEach((patient) => {
      alerts.push({
        type: 'WAITING_TIME',
        severity: 'MEDIUM',
        message: `Patient ${patient.user.firstName} ${patient.user.lastName} has been waiting for over 2 hours`,
        entityType: 'Patient',
        entityId: patient.id,
      });
    });

    return alerts;
  }

  async getKPIs() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalNurses,
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalBeds,
      availableBeds,
      occupiedBeds,
      activeNurses,
      waitingPatients,
      inAppointmentPatients,
      admittedPatients,
      inOperationPatients,
      totalPaidInvoices,
      todayPaidInvoices,
      pendingInvoicesCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.patient.count(),
      this.prisma.doctor.count(),
      this.prisma.nurse.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfWeek },
        },
      }),
      this.prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfMonth },
        },
      }),
      this.prisma.room.count(),
      this.prisma.room.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.bed.count(),
      this.prisma.bed.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.bed.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.nurse.count({
        where: {
          shifts: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      }),
      this.prisma.patient.count({ where: { currentState: 'WAITING' } }),
      this.prisma.patient.count({ where: { currentState: 'IN_APPOINTMENT' } }),
      // Count unique patients with active bed assignments instead of relying on currentState
      (async () => {
        const assignments = await this.prisma.bedAssignment.findMany({
          where: { status: BedAssignmentStatus.ACTIVE },
          select: { patientId: true },
        });
        const uniquePatientIds = new Set(assignments.map(a => a.patientId));
        console.log(`[KPIs] Found ${assignments.length} active bed assignments for ${uniquePatientIds.size} unique patients`);
        return uniquePatientIds.size;
      })(),
      this.prisma.patient.count({ where: { currentState: 'IN_OPERATION' } }),
      // Calculate total revenue from paid invoices
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
      // Calculate today's revenue from paid invoices
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        _sum: { total: true },
      }),
      // Count pending invoices
      this.prisma.invoice.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // Calculate bed availability ratio
    const bedsAvailableRatio = totalBeds > 0 ? availableBeds / totalBeds : 0;

    // Calculate patients in queue (waiting + in appointment)
    const patientsInQueue = waitingPatients + inAppointmentPatients;

    // Calculate doctors currently on shift based on availability schedule
    // Check if they have availability set for today/previous day and current time is within their availability window
    let activeDoctors = 0;
    try {
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const previousDay = currentDay === 0 ? 6 : currentDay - 1; // 6 = Saturday, previous day for Sunday
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Get all doctors with availability schedules for today OR previous day (for overnight shifts)
      const doctorsWithAvailability = await this.prisma.doctor.findMany({
        where: {
          availability: {
            some: {
              dayOfWeek: { in: [currentDay, previousDay] },
              isAvailable: true,
            },
          },
        },
        include: {
          availability: {
            where: {
              dayOfWeek: { in: [currentDay, previousDay] },
              isAvailable: true,
            },
          },
        },
      });
      
      // Filter doctors whose current time falls within any of their availability windows
      const doctorsOnShift = doctorsWithAvailability.filter(doctor => {
        return doctor.availability.some((avail: any) => {
          const startTime = avail.startTime; // HH:mm format (e.g., "21:00")
          const endTime = avail.endTime;     // HH:mm format (e.g., "05:00")
          const availDay = avail.dayOfWeek;
          
          // Handle overnight shifts (when endTime < startTime, e.g., 9 PM to 5 AM)
          if (endTime < startTime) {
            // Overnight shift spans two days
            if (availDay === currentDay) {
              // Checking today's shift: we're in the first part (e.g., Monday 9 PM - midnight)
              return currentTime >= startTime;
            } else if (availDay === previousDay) {
              // Checking previous day's shift: we're in the second part (e.g., Monday 2 AM from Sunday 9 PM shift)
              return currentTime <= endTime;
            }
            return false;
          } else {
            // Same-day shift: only check if it's for today
            if (availDay === currentDay) {
              return currentTime >= startTime && currentTime <= endTime;
            }
            return false;
          }
        });
      });
      
      activeDoctors = doctorsOnShift.length;
    } catch (error) {
      console.error('Error calculating doctors on shift:', error);
      // Fallback: count doctors with any availability schedules
      activeDoctors = await this.prisma.doctor.count({
        where: {
          availability: {
            some: {
              isAvailable: true,
            },
          },
        },
      });
    }

    return {
      users: { total: totalUsers },
      patients: { 
        total: totalPatients, 
        waiting: waitingPatients, 
        inQueue: patientsInQueue,
        inAppointment: inAppointmentPatients, 
        admitted: admittedPatients, 
        inOperation: inOperationPatients 
      },
      staff: {
        doctors: {
          total: totalDoctors,
          onShift: activeDoctors,
        },
        nurses: {
          total: totalNurses,
          onShift: activeNurses,
          assigned: activeNurses, // Assuming active nurses are assigned
          unassigned: totalNurses - activeNurses,
        },
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        thisWeek: weekAppointments,
        thisMonth: monthAppointments,
      },
      rooms: {
        total: totalRooms,
        status: {
          AVAILABLE: availableRooms,
          OCCUPIED: occupiedRooms,
        },
        available: availableRooms,
        occupied: occupiedRooms,
      },
      beds: {
        total: totalBeds,
        status: {
          AVAILABLE: availableBeds,
          OCCUPIED: occupiedBeds,
        },
        available: availableBeds,
        occupied: occupiedBeds,
        availableRatio: bedsAvailableRatio,
      },
      financial: {
        totalRevenue: Number(totalPaidInvoices._sum.total || 0),
        todayRevenue: Number(todayPaidInvoices._sum.total || 0),
        pendingInvoices: pendingInvoicesCount,
      },
    };
  }
}
