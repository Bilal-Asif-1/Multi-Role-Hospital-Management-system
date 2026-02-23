import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'OTP is required' })
  @IsString({ message: 'OTP must be a string' })
  @Transform(({ value }) => (value != null ? String(value).replace(/\D/g, '').slice(0, 6) : value))
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp: string;
}
