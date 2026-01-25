import { RoomStatus } from '@prisma/client'
import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty } from 'class-validator'

export class CreateRoomDto {
  @IsString()
  roomNumber: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  floor?: string

  @IsOptional()
  @IsNumber()
  capacity?: number

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateRoomStatusDto {
  status: RoomStatus
  notes?: string
}

export class UpdateRoomDto {
  name?: string
  type?: string
  floor?: string
  notes?: string
}

export class AssignBedDto {
  @IsString()
  @IsNotEmpty()
  roomId: string
  
  @IsOptional()
  @IsString()
  bedId?: string
  
  @IsString()
  @IsNotEmpty()
  patientId: string
  
  @IsOptional()
  @IsString()
  doctorId?: string
  
  @IsOptional()
  @IsString()
  nurseId?: string
  
  @IsOptional()
  @IsString()
  notes?: string
}

export class ReleaseBedDto {
  assignmentId?: string
  bedId?: string
  notes?: string
}

export class HousekeepingLogDto {
  status: string
  notes?: string
  completedAt?: Date
}

export class CreateBedDto {
  @IsString()
  @IsNotEmpty()
  label: string
}

