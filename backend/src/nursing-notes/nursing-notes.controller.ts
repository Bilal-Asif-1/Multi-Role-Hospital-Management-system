import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NursingNotesService } from './nursing-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Nursing Notes')
@Controller('nursing-notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NursingNotesController {
  constructor(private readonly nursingNotesService: NursingNotesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Create nursing note (Nurse only)' })
  create(@Body() createNoteDto: any, @Request() req) {
    return this.nursingNotesService.create({
      ...createNoteDto,
      nurseId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all nursing notes' })
  findAll(@Query('patientId') patientId?: string, @Request() req?: any) {
    const nurseId = req?.user?.role === UserRole.NURSE ? req.user.id : undefined;
    return this.nursingNotesService.findAll(patientId, nurseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get nursing note by ID' })
  findOne(@Param('id') id: string) {
    return this.nursingNotesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Update nursing note (Nurse only)' })
  update(@Param('id') id: string, @Body() updateNoteDto: any) {
    return this.nursingNotesService.update(id, updateNoteDto);
  }
}



