import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ShiftsService } from './shifts.service'
import { CreateDoctorShiftDto, CreateNurseShiftDto, UpdateShiftStatusDto } from './dto/create-shift.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@prisma/client'

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('doctors/:doctorId')
  getDoctorShifts(@Param('doctorId') doctorId: string) {
    return this.shiftsService.getDoctorShifts(doctorId)
  }

  @Get('nurses/:nurseId')
  getNurseShifts(@Param('nurseId') nurseId: string) {
    return this.shiftsService.getNurseShifts(nurseId)
  }

  @Post('doctors')
  createDoctorShift(@Body() dto: CreateDoctorShiftDto) {
    return this.shiftsService.createDoctorShift(dto)
  }

  @Post('nurses')
  createNurseShift(@Body() dto: CreateNurseShiftDto) {
    return this.shiftsService.createNurseShift(dto)
  }

  @Post('doctors/:id/status')
  updateDoctorShiftStatus(@Param('id') id: string, @Body() dto: UpdateShiftStatusDto) {
    return this.shiftsService.updateDoctorShiftStatus(id, dto)
  }

  @Post('nurses/:id/status')
  updateNurseShiftStatus(@Param('id') id: string, @Body() dto: UpdateShiftStatusDto) {
    return this.shiftsService.updateNurseShiftStatus(id, dto)
  }

  @Delete('doctors/:id')
  deleteDoctorShift(@Param('id') id: string) {
    return this.shiftsService.deleteDoctorShift(id)
  }

  @Delete('nurses/:id')
  deleteNurseShift(@Param('id') id: string) {
    return this.shiftsService.deleteNurseShift(id)
  }
}

