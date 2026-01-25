import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { RoomsService } from './rooms.service'
import { AssignBedDto, CreateRoomDto, CreateBedDto, HousekeepingLogDto, ReleaseBedDto, UpdateRoomStatusDto, UpdateRoomDto } from './dto/create-room.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@prisma/client'

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getRooms() {
    return this.roomsService.getRooms()
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoomById(id)
  }

  @Get(':id/beds')
  getBeds(@Param('id') id: string) {
    return this.roomsService.getBedsForRoom(id)
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.roomsService.getOccupancyHistory(id)
  }

  @Post()
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoomStatusDto) {
    return this.roomsService.updateRoomStatus(id, dto)
  }

  @Patch(':id')
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto)
  }

  @Post('assign')
  assignBed(@Body() dto: AssignBedDto) {
    return this.roomsService.assignBed(dto)
  }

  @Post('release')
  releaseBed(@Body() dto: ReleaseBedDto) {
    return this.roomsService.releaseBed(dto)
  }

  @Post(':id/housekeeping')
  logHousekeeping(@Param('id') id: string, @Body() dto: HousekeepingLogDto) {
    return this.roomsService.logHousekeeping(id, dto)
  }

  @Post(':id/beds')
  createBed(@Param('id') id: string, @Body() dto: CreateBedDto) {
    return this.roomsService.createBed(id, dto)
  }

  @Delete('beds/:bedId')
  deleteBed(@Param('bedId') bedId: string) {
    return this.roomsService.deleteBed(bedId)
  }
}

