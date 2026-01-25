import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VitalsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    patientId: string;
    recordedBy: string;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    notes?: string;
  }) {
    // Calculate BMI if weight and height provided
    let bmi = null;
    if (data.weight && data.height) {
      const heightInMeters = Number(data.height) / 100;
      bmi = Number(data.weight) / (heightInMeters * heightInMeters);
    }

    return this.prisma.vitals.create({
      data: {
        patientId: data.patientId,
        recordedBy: data.recordedBy,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        temperature: data.temperature,
        oxygenSaturation: data.oxygenSaturation,
        weight: data.weight,
        height: data.height,
        bmi: bmi,
        notes: data.notes,
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
              },
            },
          },
        },
      },
    });
  }

  async findAll(patientId?: string) {
    const where = patientId ? { patientId } : {};
    return this.prisma.vitals.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.vitals.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getLatest(patientId: string) {
    return this.prisma.vitals.findFirst({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });
  }
}



