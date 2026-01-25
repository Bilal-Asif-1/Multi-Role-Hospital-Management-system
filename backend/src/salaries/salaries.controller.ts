import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@prisma/client'
import { SalariesService } from './salaries.service'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('Salaries')
@Controller('salaries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalariesController {
  constructor(
    private readonly salariesService: SalariesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create salary record (Admin only)' })
  create(@Body() createDto: any) {
    return this.salariesService.create(createDto)
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all salaries (Admin only)' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('employeeType') employeeType?: 'DOCTOR' | 'NURSE',
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.salariesService.findAll({
      employeeId,
      employeeType,
      includeDeleted: includeDeleted === 'true',
    })
  }

  @Get('my-salaries')
  @ApiOperation({ summary: 'Get my salaries (Doctor/Nurse only)' })
  async getMySalaries(@Request() req) {
    const user = req.user
    // Get employee ID from user role
    if (user.role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      })
      if (!doctor) {
        return []
      }
      return this.salariesService.getEmployeeSalaries(doctor.id, 'DOCTOR')
    } else if (user.role === UserRole.NURSE) {
      const nurse = await this.prisma.nurse.findUnique({
        where: { userId: user.id },
      })
      if (!nurse) {
        return []
      }
      return this.salariesService.getEmployeeSalaries(nurse.id, 'NURSE')
    }
    return []
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salary by ID' })
  findOne(@Param('id') id: string) {
    return this.salariesService.findOne(id)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete salary (Admin only)' })
  remove(@Param('id') id: string) {
    return this.salariesService.delete(id)
  }
}


