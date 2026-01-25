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
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create prescription' })
  create(@Body() createDto: any, @Request() req) {
    // Prescription uses userId for doctorId
    return this.prescriptionsService.create({
      ...createDto,
      doctorId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Request() req?: any,
  ) {
    // Auto-filter by role
    if (req.user.role === UserRole.PATIENT) {
      // Convert User.id to Patient.id
      const patient = await this.prescriptionsService.findPatientByUserId(req.user.id);
      if (patient) {
        patientId = patient.id;
      }
    } else if (req.user.role === UserRole.DOCTOR) {
      doctorId = req.user.id;
    }
    return this.prescriptionsService.findAll(patientId, doctorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update prescription' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.prescriptionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete prescription' })
  remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }
}

