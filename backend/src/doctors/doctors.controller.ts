import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get available doctors by specialization and slot' })
  findAvailable(
    @Query('specialization') specialization?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.doctorsService.findAvailableDoctors({ specialization, start, end });
  }

  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get current doctor profile' })
  async getMyProfile(@Request() req) {
    let doctor = await this.doctorsService.findByUserId(req.user.id);
    if (!doctor) {
      // Auto-create doctor profile if missing
      console.log(`Doctor profile not found for user ${req.user.id}, creating it automatically...`);
      try {
        doctor = await this.doctorsService.createDoctorProfile(req.user.id);
        if (!doctor) {
          throw new NotFoundException('Doctor profile not found and could not be created. Please contact admin.');
        }
      } catch (error: any) {
        console.error('Error creating doctor profile:', error);
        throw new NotFoundException(`Failed to create doctor profile: ${error.message || 'Unknown error'}`);
      }
    }
    return doctor;
  }

  @Post('availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update doctor availability' })
  async updateAvailability(
    @Body() body: { availability: any[]; doctorId?: string },
    @Request() req,
  ) {
    // If doctorId is provided and user is ADMIN, update that doctor's availability
    if (body.doctorId && req.user.role === UserRole.ADMIN) {
      console.log('Admin updating availability for doctor ID:', body.doctorId);
      const doctor = await this.doctorsService.findOne(body.doctorId);
      if (!doctor) {
        console.error('Doctor not found with ID:', body.doctorId);
        throw new NotFoundException(`Doctor not found with ID: ${body.doctorId}`);
      }
      console.log('Found doctor:', doctor.id, 'Updating availability...');
      const result = await this.doctorsService.updateAvailability(doctor.id, body.availability);
      console.log('Availability updated successfully:', result);
      return result;
    }

    // Otherwise, update the current doctor's own availability
    let doctor = await this.doctorsService.findByUserId(req.user.id);
    if (!doctor) {
      // If doctor profile doesn't exist, create it automatically
      // This can happen if user was just registered and profile wasn't created properly
      console.log(`Doctor profile not found for user ${req.user.id}, creating it automatically...`);
      try {
        doctor = await this.doctorsService.createDoctorProfile(req.user.id);
        if (!doctor) {
          throw new NotFoundException('Doctor profile not found and could not be created. Please contact admin.');
        }
      } catch (error: any) {
        console.error('Error creating doctor profile:', error);
        throw new NotFoundException(`Failed to create doctor profile: ${error.message || 'Unknown error'}`);
      }
    }
    return this.doctorsService.updateAvailability(doctor.id, body.availability);
  }

  @Get('availability/:doctorId')
  @ApiOperation({ summary: 'Get doctor availability' })
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.doctorsService.getAvailability(doctorId);
  }

  @Get(':id/settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get doctor full settings (Admin only)' })
  async getSettings(@Param('id') id: string) {
    const doctor = await this.doctorsService.findOne(id);
    if (!doctor) {
      throw new NotFoundException(`Doctor not found with ID: ${id}`);
    }
    const availability = await this.doctorsService.getAvailability(doctor.id);
    return {
      profile: doctor,
      availability: availability || [],
      cv: doctor.cvData ? {
        name: doctor.cvFileName,
        data: doctor.cvData,
        type: doctor.cvFileType,
      } : null,
      license: doctor.licenseImage ? doctor.licenseImage : null,
    };
  }

  @Get(':id/workload')
  @ApiOperation({ summary: 'Get doctor workload statistics' })
  getWorkload(@Param('id') id: string) {
    return this.doctorsService.getWorkload(id);
  }

  @Get(':id/assigned-patients')
  @ApiOperation({ summary: 'Get assigned patients for a doctor' })
  getAssignedPatients(@Param('id') id: string) {
    return this.doctorsService.getAssignedPatients(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch('my-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update current doctor profile' })
  async updateMyProfile(@Request() req, @Body() updateData: any) {
    let doctor = await this.doctorsService.findByUserId(req.user.id);
    if (!doctor) {
      // Auto-create doctor profile if missing
      console.log(`Doctor profile not found for user ${req.user.id}, creating it automatically...`);
      try {
        doctor = await this.doctorsService.createDoctorProfile(req.user.id);
        if (!doctor) {
          throw new NotFoundException('Doctor profile not found and could not be created. Please contact admin.');
        }
      } catch (error: any) {
        console.error('Error creating doctor profile:', error);
        throw new NotFoundException(`Failed to create doctor profile: ${error.message || 'Unknown error'}`);
      }
    }
    return this.doctorsService.update(doctor.id, updateData);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update doctor profile (Admin only)' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.doctorsService.update(id, updateData);
  }
}





