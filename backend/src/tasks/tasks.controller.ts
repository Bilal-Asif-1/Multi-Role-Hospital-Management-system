import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create task (Doctor/Admin only)' })
  create(@Body() createTaskDto: any, @Request() req) {
    return this.tasksService.create({
      ...createTaskDto,
      assignedBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  findAll(@Query('status') status?: string, @Request() req?: any) {
    const assignedTo = req?.user?.role === UserRole.NURSE ? req.user.id : undefined;
    return this.tasksService.findAll(assignedTo, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() updateTaskDto: any) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Mark task as completed' })
  markCompleted(@Param('id') id: string) {
    return this.tasksService.markCompleted(id);
  }
}



