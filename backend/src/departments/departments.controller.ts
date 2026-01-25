import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { DepartmentsService } from './departments.service'
import { CreateDepartmentDto, UpdateDepartmentDto, AssignRoomDto, AssignDoctorDto, AssignNurseDto } from './dto/create-department.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@prisma/client'

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  getAll() {
    return this.departmentsService.getAll()
  }

  @Get('available-rooms')
  getAvailableRooms() {
    return this.departmentsService.getAvailableRooms()
  }

  @Get('available-doctors')
  getAvailableDoctors() {
    return this.departmentsService.getAvailableDoctors()
  }

  @Get('available-nurses')
  getAvailableNurses() {
    return this.departmentsService.getAvailableNurses()
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.departmentsService.getById(id)
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.departmentsService.delete(id)
  }

  @Post(':id/rooms')
  assignRoom(@Param('id') id: string, @Body() dto: AssignRoomDto) {
    return this.departmentsService.assignRoom(id, dto)
  }

  @Delete(':id/rooms/:roomId')
  removeRoom(@Param('id') id: string, @Param('roomId') roomId: string) {
    return this.departmentsService.removeRoom(id, roomId)
  }

  @Post(':id/doctors')
  assignDoctor(@Param('id') id: string, @Body() dto: AssignDoctorDto) {
    return this.departmentsService.assignDoctor(id, dto)
  }

  @Delete(':id/doctors/:doctorId')
  removeDoctor(@Param('id') id: string, @Param('doctorId') doctorId: string) {
    return this.departmentsService.removeDoctor(id, doctorId)
  }

  @Post(':id/nurses')
  assignNurse(@Param('id') id: string, @Body() dto: AssignNurseDto) {
    return this.departmentsService.assignNurse(id, dto)
  }

  @Delete(':id/nurses/:nurseId')
  removeNurse(@Param('id') id: string, @Param('nurseId') nurseId: string) {
    return this.departmentsService.removeNurse(id, nurseId)
  }
}

