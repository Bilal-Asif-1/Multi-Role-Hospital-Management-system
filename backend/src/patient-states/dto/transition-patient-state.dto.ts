import { PatientState } from '@prisma/client'

export class TransitionPatientStateDto {
  patientId: string
  toState: PatientState
  context?: string
}

