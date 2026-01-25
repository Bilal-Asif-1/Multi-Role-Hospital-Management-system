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
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create patient (Admin only)' })
  async create(@Body() createDto: any) {
    try {
      return await this.patientsService.create(createDto);
    } catch (error: any) {
      console.error('Error creating patient:', error);
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new ConflictException(`Email ${createDto.user?.email} already exists. Please use a different email or register as returning patient.`);
        }
        throw new ConflictException('A record with this information already exists.');
      }
      // Re-throw error messages from service
      if (error.message) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get all patients with search' })
  findAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get current patient profile' })
  getMyProfile(@Request() req) {
    return this.patientsService.findByUserId(req.user.id);
  }

  @Get(':id/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get patient overview with relations' })
  getOverview(@Param('id') id: string) {
    return this.patientsService.getOverview(id);
  }

  @Get(':id/settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get patient full settings (Admin only)' })
  async getSettings(@Param('id') id: string) {
    const patient = await this.patientsService.findOne(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return {
      profile: patient,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch('my-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update current patient profile' })
  updateMyProfile(@Request() req, @Body() updateDto: any) {
    return this.patientsService.updateByUserId(req.user.id, updateDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.patientsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete patient' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}



