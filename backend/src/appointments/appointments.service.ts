import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, InvoiceStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any) {
    // Ensure appointmentDate is a Date object
    const appointmentData = {
      ...data,
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : new Date(),
    };
    
    // Get doctor details to check for appointment fees
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: appointmentData.doctorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get patient profile for invoice
    const patient = await this.prisma.patient.findUnique({
      where: { userId: appointmentData.patientId },
      select: { id: true },
    });

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Automatically create PAID invoice if doctor has appointment fees
    if (doctor && doctor.appointmentFees && doctor.appointmentFees > 0 && patient) {
      const appointmentFee = parseFloat(doctor.appointmentFees.toString());
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create invoice with PAID status
      const invoice = await this.prisma.invoice.create({
        data: {
          patientId: patient.id,
          invoiceNumber,
          invoiceDate: new Date(),
          status: InvoiceStatus.PAID,
          items: [
            {
              description: `Appointment Fee - Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
              quantity: 1,
              unitPrice: appointmentFee,
              total: appointmentFee,
            },
          ],
          subtotal: appointmentFee,
          tax: 0,
          discount: 0,
          total: appointmentFee,
          notes: `Appointment scheduled for ${new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${appointmentData.appointmentTime || 'TBD'}`,
          paidAt: new Date(),
        },
      });

      // Update hospital account balance
      let hospitalAccount = await this.prisma.hospitalAccount.findFirst();
      if (!hospitalAccount) {
        hospitalAccount = await this.prisma.hospitalAccount.create({
          data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
        });
      }

      await this.prisma.hospitalAccount.update({
        where: { id: hospitalAccount.id },
        data: {
          balance: hospitalAccount.balance + appointmentFee,
          totalRevenue: hospitalAccount.totalRevenue + appointmentFee,
        },
      });
    }

    // Create notifications
    try {
      const appointmentDate = new Date(appointmentData.appointmentDate);
      const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const formattedTime = appointmentData.appointmentTime || 'TBD';

      // Notify patient (appointmentData.patientId is User.id)
      await this.notificationsService.create({
        userId: appointmentData.patientId,
        title: 'New Appointment Scheduled',
        message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} is scheduled for ${formattedDate} at ${formattedTime}`,
        type: 'APPOINTMENT',
        actionUrl: '/patient',
        relatedEntityType: 'APPOINTMENT',
        relatedEntityId: appointment.id,
      });

      // Notify doctor (appointmentData.doctorId is User.id)
      await this.notificationsService.create({
        userId: appointmentData.doctorId,
        title: 'New Appointment Scheduled',
        message: `New appointment with ${appointment.patient.firstName} ${appointment.patient.lastName} on ${formattedDate} at ${formattedTime}`,
        type: 'APPOINTMENT',
        actionUrl: '/doctor/appointments',
        relatedEntityType: 'APPOINTMENT',
        relatedEntityId: appointment.id,
      });
    } catch (error) {
      console.error('Error creating appointment notifications:', error);
      // Don't fail appointment creation if notification fails
    }
    
    return appointment;
  }

  async findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: any = {};
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.appointmentDate = {};
      if (filters.dateFrom) where.appointmentDate.gte = filters.dateFrom;
      if (filters.dateTo) where.appointmentDate.lte = filters.dateTo;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    const oldAppointment = await this.findOne(id);
    
    const updated = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Create notifications for status changes
    try {
      if (data.status && data.status !== oldAppointment.status) {
        const appointmentDate = new Date(updated.appointmentDate);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedTime = updated.appointmentTime || 'TBD';

        if (data.status === AppointmentStatus.CONFIRMED) {
          // Notify patient (updated.patientId is User.id)
          await this.notificationsService.create({
            userId: updated.patientId,
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${updated.doctor?.firstName} ${updated.doctor?.lastName} on ${formattedDate} at ${formattedTime} has been confirmed`,
            type: 'APPOINTMENT',
            actionUrl: '/patient',
            relatedEntityType: 'APPOINTMENT',
            relatedEntityId: id,
          });
        } else if (data.status === AppointmentStatus.CANCELLED) {
          // Notify both patient and doctor
          await this.notificationsService.create({
            userId: updated.patientId,
            title: 'Appointment Cancelled',
            message: `Your appointment with Dr. ${updated.doctor?.firstName} ${updated.doctor?.lastName} on ${formattedDate} has been cancelled`,
            type: 'APPOINTMENT',
            actionUrl: '/patient',
            relatedEntityType: 'APPOINTMENT',
            relatedEntityId: id,
          });
          await this.notificationsService.create({
            userId: updated.doctorId,
            title: 'Appointment Cancelled',
            message: `Appointment with ${updated.patient?.firstName} ${updated.patient?.lastName} on ${formattedDate} has been cancelled`,
            type: 'APPOINTMENT',
            actionUrl: '/doctor/appointments',
            relatedEntityType: 'APPOINTMENT',
            relatedEntityId: id,
          });
        } else if (data.status === AppointmentStatus.RESCHEDULED) {
          // Notify both patient and doctor
          await this.notificationsService.create({
            userId: updated.patientId,
            title: 'Appointment Rescheduled',
            message: `Your appointment with Dr. ${updated.doctor?.firstName} ${updated.doctor?.lastName} has been rescheduled to ${formattedDate} at ${formattedTime}`,
            type: 'APPOINTMENT',
            actionUrl: '/patient',
            relatedEntityType: 'APPOINTMENT',
            relatedEntityId: id,
          });
          await this.notificationsService.create({
            userId: updated.doctorId,
            title: 'Appointment Rescheduled',
            message: `Appointment with ${updated.patient?.firstName} ${updated.patient?.lastName} has been rescheduled to ${formattedDate} at ${formattedTime}`,
            type: 'APPOINTMENT',
            actionUrl: '/doctor/appointments',
            relatedEntityType: 'APPOINTMENT',
            relatedEntityId: id,
          });
        }
      }
    } catch (error) {
      console.error('Error creating appointment update notifications:', error);
      // Don't fail update if notification fails
    }

    return updated;
  }

  async cancel(id: string) {
    return this.update(id, { status: AppointmentStatus.CANCELLED });
  }

  async reschedule(id: string, appointmentDate: Date, appointmentTime: string) {
    return this.update(id, {
      appointmentDate,
      appointmentTime,
      status: AppointmentStatus.RESCHEDULED,
    });
  }

  async remove(id: string) {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}





