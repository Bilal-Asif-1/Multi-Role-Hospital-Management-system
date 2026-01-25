import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { PatientStatesService } from './patient-states.service'
import { TransitionPatientStateDto } from './dto/transition-patient-state.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@prisma/client'

@Controller('patient-states')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
export class PatientStatesController {
  constructor(private readonly patientStatesService: PatientStatesService) {}

  @Post('transition')
  transition(@Body() dto: TransitionPatientStateDto) {
    return this.patientStatesService.transitionState(dto)
  }

  @Get(':patientId/history')
  getHistory(@Param('patientId') patientId: string) {
    return this.patientStatesService.getStateHistory(patientId)
  }
}

