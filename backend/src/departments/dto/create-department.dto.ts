import { IsString, IsOptional, IsNotEmpty } from 'class-validator'

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  headDoctorId?: string
}

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  headDoctorId?: string
}

export class AssignRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string
}

export class AssignDoctorDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string
}

export class AssignNurseDto {
  @IsString()
  @IsNotEmpty()
  nurseId: string
}

