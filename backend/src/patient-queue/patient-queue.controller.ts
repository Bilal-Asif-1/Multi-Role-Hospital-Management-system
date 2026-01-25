import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientQueueService } from './patient-queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Patient Queue')
@Controller('patient-queue')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientQueueController {
  constructor(private readonly patientQueueService: PatientQueueService) {}

  @Post('check-in')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Check-in patient (Nurse/Admin/Doctor)' })
  checkIn(@Body() checkInDto: any) {
    return this.patientQueueService.checkIn(checkInDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get patient queue' })
  findAll(@Query('status') status?: string, @Query('doctorId') doctorId?: string) {
    return this.patientQueueService.findAll(status, doctorId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update patient queue status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.patientQueueService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove patient from queue' })
  remove(@Param('id') id: string) {
    return this.patientQueueService.remove(id);
  }
}



