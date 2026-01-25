import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Vitals')
@Controller('vitals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Record patient vitals' })
  create(@Body() createVitalsDto: any, @Request() req) {
    return this.vitalsService.create({
      ...createVitalsDto,
      recordedBy: req.user.id,
    });
  }

  @Get('patient/:patientId/latest')
  @ApiOperation({ summary: 'Get latest vitals for a patient' })
  getLatest(@Param('patientId') patientId: string) {
    return this.vitalsService.getLatest(patientId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get vitals for a specific patient' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.vitalsService.findAll(patientId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vitals records' })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    // If patientId is provided in query, use it
    // Otherwise, nurses and doctors can see all, patients see only their own
    const finalPatientId = patientId || (req.user.role === UserRole.PATIENT ? req.user.id : undefined);
    return this.vitalsService.findAll(finalPatientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vitals record by ID' })
  findOne(@Param('id') id: string) {
    return this.vitalsService.findOne(id);
  }
}

