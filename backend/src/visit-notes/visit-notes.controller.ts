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
import { VisitNotesService } from './visit-notes.service';
import { DoctorsService } from '../doctors/doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Visit Notes (EHR)')
@Controller('visit-notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VisitNotesController {
  constructor(
    private readonly visitNotesService: VisitNotesService,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create visit note' })
  async create(@Body() createDto: any, @Request() req) {
    // Get doctor ID from user's doctor profile
    const doctor = await this.doctorsService.findByUserId(req.user.id);
    if (!doctor) {
      throw new Error('Doctor profile not found');
    }
    return this.visitNotesService.create({
      ...createDto,
      doctorId: doctor.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all visit notes' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Request() req?: any,
  ) {
    // Auto-filter by role
    if (req?.user?.role === UserRole.PATIENT) {
      // For patients, we need to find the patient record by userId
      // This will be handled by patientId query param if needed
    } else if (req?.user?.role === UserRole.DOCTOR) {
      // For doctors, get their doctor profile ID (not user ID)
      try {
        const doctor = await this.doctorsService.findByUserId(req.user.id);
        if (doctor) {
          doctorId = doctor.id; // Use doctor.id, not user.id
        }
      } catch (error) {
        console.error('Error finding doctor profile:', error);
        // Continue without filtering if doctor profile not found
      }
    }
    return this.visitNotesService.findAll(patientId, doctorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit note by ID' })
  findOne(@Param('id') id: string) {
    return this.visitNotesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update visit note' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.visitNotesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete visit note' })
  remove(@Param('id') id: string) {
    return this.visitNotesService.remove(id);
  }
}

