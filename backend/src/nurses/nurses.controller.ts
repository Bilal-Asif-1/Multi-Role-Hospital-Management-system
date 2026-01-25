import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NursesService } from './nurses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Nurses')
@Controller('nurses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NursesController {
  constructor(private readonly nursesService: NursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all nurses' })
  findAll() {
    return this.nursesService.findAll();
  }

  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get current nurse profile' })
  getMyProfile(@Request() req) {
    return this.nursesService.findByUserId(req.user.id);
  }

  @Get(':id/workload')
  @ApiOperation({ summary: 'Get nurse workload statistics' })
  getWorkload(@Param('id') id: string) {
    return this.nursesService.getWorkload(id);
  }

  @Get(':id/assigned-patients')
  @ApiOperation({ summary: 'Get assigned patients for a nurse' })
  getAssignedPatients(@Param('id') id: string) {
    return this.nursesService.getAssignedPatients(id);
  }

  @Get(':id/settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get nurse full settings (Admin only)' })
  async getSettings(@Param('id') id: string) {
    const nurse = await this.nursesService.findOne(id);
    if (!nurse) {
      throw new NotFoundException(`Nurse not found with ID: ${id}`);
    }
    return {
      profile: nurse,
      cv: nurse.cvData ? {
        name: nurse.cvFileName,
        data: nurse.cvData,
        type: nurse.cvFileType,
      } : null,
      license: nurse.licenseImage ? nurse.licenseImage : null,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get nurse by ID' })
  findOne(@Param('id') id: string) {
    return this.nursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update nurse profile (Admin only)' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    try {
      return await this.nursesService.update(id, updateData);
    } catch (error) {
      console.error('Error in nurses controller update:', error);
      throw error;
    }
  }
}

