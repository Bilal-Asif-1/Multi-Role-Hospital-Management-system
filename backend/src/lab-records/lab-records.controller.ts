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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { LabRecordsService } from './lab-records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Lab Records')
@Controller('lab-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LabRecordsController {
  constructor(private readonly labRecordsService: LabRecordsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Create lab record' })
  async create(@Body() createDto: any, @Request() req) {
    try {
      // If patient is creating, auto-set patientId from their profile
      if (req.user.role === UserRole.PATIENT && !createDto.patientId) {
        const patient = await this.labRecordsService.findPatientByUserId(req.user.id);
        if (!patient) {
          throw new BadRequestException('Patient profile not found. Please complete your profile first.');
        }
        createDto.patientId = patient.id;
      }
      
      // Validate required fields
      if (!createDto.patientId) {
        throw new BadRequestException('Patient ID is required');
      }
      if (!createDto.testName || !createDto.testName.trim()) {
        throw new BadRequestException('Test name is required');
      }

      // Convert testDate to Date if it's a string
      if (createDto.testDate && typeof createDto.testDate === 'string') {
        createDto.testDate = new Date(createDto.testDate);
      }

      return await this.labRecordsService.create(createDto, req.user.id, req.user.role);
    } catch (error) {
      console.error('Error creating lab record:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all lab records' })
  async findAll(@Query('patientId') patientId?: string, @Request() req?: any) {
    // Auto-filter by role - get patientId from patient profile for PATIENT role
    if (req.user.role === UserRole.PATIENT && !patientId) {
      const patient = await this.labRecordsService.findPatientByUserId(req.user.id);
      if (patient) {
        patientId = patient.id;
      }
    }
    return this.labRecordsService.findAll(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lab record by ID' })
  findOne(@Param('id') id: string) {
    return this.labRecordsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Update lab record' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.labRecordsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Delete lab record' })
  async remove(@Param('id') id: string, @Request() req) {
    // If patient is deleting, verify they own the record
    if (req.user.role === UserRole.PATIENT) {
      const labRecord = await this.labRecordsService.findOne(id);
      if (labRecord) {
        const patient = await this.labRecordsService.findPatientByUserId(req.user.id);
        if (!patient || labRecord.patientId !== patient.id) {
          throw new BadRequestException('You can only delete your own lab records');
        }
      }
    }
    return this.labRecordsService.remove(id);
  }
}





