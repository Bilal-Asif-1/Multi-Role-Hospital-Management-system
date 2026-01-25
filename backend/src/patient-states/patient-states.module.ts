import { Module } from '@nestjs/common'
import { PatientStatesController } from './patient-states.controller'
import { PatientStatesService } from './patient-states.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PatientStatesController],
  providers: [PatientStatesService],
  exports: [PatientStatesService],
})
export class PatientStatesModule {}

