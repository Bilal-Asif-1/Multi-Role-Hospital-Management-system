import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create appointment' })
  create(@Body() createDto: any, @Request() req) {
    // If patient is creating, use their ID
    if (req.user.role === UserRole.PATIENT) {
      createDto.patientId = req.user.id;
    }
    return this.appointmentsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments with filters' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Request() req?: any,
  ) {
    // Auto-filter by role
    const filters: any = {};
    if (req.user.role === UserRole.PATIENT) {
      filters.patientId = req.user.id;
    } else if (req.user.role === UserRole.DOCTOR) {
      filters.doctorId = req.user.id;
    } else {
      if (patientId) filters.patientId = patientId;
      if (doctorId) filters.doctorId = doctorId;
    }
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.appointmentsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.appointmentsService.update(id, updateDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(
    @Param('id') id: string,
    @Body() body: { appointmentDate: string; appointmentTime: string },
  ) {
    return this.appointmentsService.reschedule(
      id,
      new Date(body.appointmentDate),
      body.appointmentTime,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}





