import { Controller, Post, Body, UseGuards, Get, Request, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SendOtpDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
        loginDto.role,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      // Check if user is approved (admins are always approved)
      // Allow unapproved users to login if profile is not completed (they need to fill profile)
      if (user.role !== 'ADMIN' && !user.isApproved && user.profileCompleted) {
        throw new UnauthorizedException('Your account is pending admin approval. Please wait for approval before logging in.');
      }
      // If profile not completed, user can login to complete profile
      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Your account has been deactivated. Please contact admin.');
      }
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      return this.authService.login(
        user,
        Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Login failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email for verification' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      console.log('=== Send OTP Request ===');
      console.log('Request body:', JSON.stringify(sendOtpDto, null, 2));
      console.log('Email:', sendOtpDto.email);
      console.log('Email type:', typeof sendOtpDto.email);
      
      if (!sendOtpDto || !sendOtpDto.email) {
        throw new HttpException(
          { statusCode: 400, message: 'Email is required', error: 'Bad Request' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.authService.sendOtp(sendOtpDto.email);
      console.log('Send OTP successful:', { email: sendOtpDto.email });
      return result;
    } catch (error: any) {
      console.error('=== Send OTP Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);
      console.error('Error stack:', error.stack);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // If it's a BadRequestException, convert to HttpException
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: error.message || 'Failed to send OTP',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.BAD_REQUEST,
          message: error.message || 'Failed to send OTP',
          error: 'Bad Request',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      const result = await this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
      return result;
    } catch (error: any) {
      console.error('Verify OTP controller error:', error);
      throw new HttpException(
        error.message || 'Failed to verify OTP',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset code (sends OTP to email)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      return await this.authService.requestPasswordReset(dto.email);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to send reset code',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with email + OTP + new password' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to reset password',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user (requires email verification)' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      console.log('Registration request received:', { 
        email: registerDto.email, 
        role: registerDto.role,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName
      });
      const result = await this.authService.register(registerDto);
      console.log('Registration successful:', result.user?.email);
      return result;
    } catch (error: any) {
      console.error('Registration controller error:', error);
      // Log full error details for debugging
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.meta) {
        console.error('Error meta:', error.meta);
      }
      if (error.response) {
        console.error('Error response:', error.response);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      const errorMessage = error.message || 'Registration failed';
      console.error('Final error message:', errorMessage);
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}

