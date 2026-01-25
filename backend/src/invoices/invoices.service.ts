import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber,
      },
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
      },
    });

    // If invoice is created with PAID status, update hospital account
    if (invoice.status === InvoiceStatus.PAID && invoice.paidAt) {
      await this.updateHospitalBalance(parseFloat(invoice.total.toString()), true);
    }

    return invoice;
  }

  async findAll(patientId?: string, status?: InvoiceStatus) {
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    return this.prisma.invoice.findMany({
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
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({
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
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    // Get current invoice to check status change
    const currentInvoice = await this.prisma.invoice.findUnique({
      where: { id },
    })

    const updated = await this.prisma.invoice.update({
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
      },
    })

    // If status changed to PAID, update hospital account
    if (data.status === InvoiceStatus.PAID && currentInvoice?.status !== InvoiceStatus.PAID) {
      await this.updateHospitalBalance(parseFloat(updated.total.toString()), true)
    }

    return updated
  }

  async markAsPaid(id: string) {
    return this.update(id, {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
    })
  }

  private async updateHospitalBalance(amount: number, isRevenue: boolean = true) {
    let account = await this.prisma.hospitalAccount.findFirst()
    if (!account) {
      account = await this.prisma.hospitalAccount.create({
        data: { balance: 0, totalRevenue: 0, totalExpenses: 0 },
      })
    }

    const updateData: any = {
      balance: isRevenue ? { increment: amount } : { decrement: amount },
    }

    if (isRevenue) {
      updateData.totalRevenue = { increment: amount }
    } else {
      updateData.totalExpenses = { increment: amount }
    }

    return this.prisma.hospitalAccount.update({
      where: { id: account.id },
      data: updateData,
    })
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}





