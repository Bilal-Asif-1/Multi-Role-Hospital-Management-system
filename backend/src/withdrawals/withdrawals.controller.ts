import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { WithdrawalsService } from './withdrawals.service'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole, WithdrawalStatus } from '@prisma/client'

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(
    private readonly withdrawalsService: WithdrawalsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create withdrawal request' })
  async create(@Body() createDto: { employeeId?: string; employeeType?: 'DOCTOR' | 'NURSE'; amount: number; notes?: string }, @Request() req) {
    let employeeId = createDto.employeeId
    let employeeType = createDto.employeeType

    // If doctor/nurse is creating, use their own ID
    if (req.user.role === UserRole.DOCTOR || req.user.role === UserRole.NURSE) {
      // Get doctor/nurse profile
      if (req.user.role === UserRole.DOCTOR) {
        const doctor = await this.prisma.doctor.findUnique({
          where: { userId: req.user.id },
        })
        if (!doctor) {
          throw new NotFoundException('Doctor profile not found')
        }
        employeeId = doctor.id
        employeeType = 'DOCTOR'
      } else if (req.user.role === UserRole.NURSE) {
        const nurse = await this.prisma.nurse.findUnique({
          where: { userId: req.user.id },
        })
        if (!nurse) {
          throw new NotFoundException('Nurse profile not found')
        }
        employeeId = nurse.id
        employeeType = 'NURSE'
      }
    }

    if (!employeeId || !employeeType) {
      throw new BadRequestException('Employee ID and type are required')
    }

    return this.withdrawalsService.create(employeeId, employeeType, createDto.amount, createDto.notes)
  }

  @Get('my-withdrawals')
  @ApiOperation({ summary: 'Get my withdrawals' })
  async getMyWithdrawals(@Request() req) {
    if (req.user.role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: req.user.id },
      })
      if (!doctor) {
        throw new Error('Doctor profile not found')
      }
      return this.withdrawalsService.getMyWithdrawals(doctor.id, 'DOCTOR')
    } else if (req.user.role === UserRole.NURSE) {
      const nurse = await this.prisma.nurse.findUnique({
        where: { userId: req.user.id },
      })
      if (!nurse) {
        throw new Error('Nurse profile not found')
      }
      return this.withdrawalsService.getMyWithdrawals(nurse.id, 'NURSE')
    }
    throw new Error('Invalid role')
  }

  @Get('hospital-account')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get hospital account balance (Admin only)' })
  getHospitalAccount() {
    return this.withdrawalsService.getHospitalAccount()
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all withdrawals (Admin only)' })
  findAll(@Query('employeeId') employeeId?: string, @Query('employeeType') employeeType?: string, @Query('status') status?: WithdrawalStatus) {
    return this.withdrawalsService.findAll({ employeeId, employeeType, status })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get withdrawal by ID' })
  findOne(@Param('id') id: string) {
    return this.withdrawalsService.findOne(id)
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve withdrawal (Admin only)' })
  approve(@Param('id') id: string) {
    return this.withdrawalsService.approve(id)
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject withdrawal (Admin only)' })
  reject(@Param('id') id: string, @Body() body: { rejectionReason?: string }) {
    return this.withdrawalsService.reject(id, body.rejectionReason)
  }
}


