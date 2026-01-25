import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TransitionPatientStateDto } from './dto/transition-patient-state.dto'
import { PatientState } from '@prisma/client'

@Injectable()
export class PatientStatesService {
  constructor(private readonly prisma: PrismaService) {}

  async transitionState(dto: TransitionPatientStateDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    })

    if (!patient) {
      throw new NotFoundException('Patient not found')
    }

    if (patient.currentState === dto.toState) {
      throw new BadRequestException('Patient is already in the target state')
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.patientStateLog.create({
        data: {
          patientId: dto.patientId,
          fromState: patient.currentState,
          toState: dto.toState,
          context: dto.context,
        },
      })

      return tx.patient.update({
        where: { id: dto.patientId },
        data: { currentState: dto.toState },
      })
    })
  }

  async getStateHistory(patientId: string) {
    await this.ensurePatient(patientId)

    return this.prisma.patientStateLog.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })
  }

  private async ensurePatient(patientId: string) {
    const patientExists = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    })

    if (!patientExists) {
      throw new NotFoundException('Patient not found')
    }
  }
}

