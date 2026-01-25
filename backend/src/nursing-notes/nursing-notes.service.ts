import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NursingNotesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    patientId: string;
    nurseId: string;
    noteType?: string;
    content: string;
    observations?: string;
    interventions?: string;
  }) {
    return this.prisma.nursingNote.create({
      data: {
        patientId: data.patientId,
        nurseId: data.nurseId,
        noteType: data.noteType,
        content: data.content,
        observations: data.observations,
        interventions: data.interventions,
      },
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
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(patientId?: string, nurseId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (nurseId) where.nurseId = nurseId;

    return this.prisma.nursingNote.findMany({
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
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { noteDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.nursingNote.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.nursingNote.update({
      where: { id },
      data,
    });
  }
}



