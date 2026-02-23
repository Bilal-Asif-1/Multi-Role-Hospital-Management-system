import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'doctor@hospital.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'PATIENT', description: 'Role to login as (required when same email has multiple roles)' })
  @IsString()
  @IsIn(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'])
  role: string;
}





