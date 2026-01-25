import { Controller, Post, Body, UseGuards, Get, Request, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
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

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      console.log('Registration request received:', { 
        email: registerDto.email, 
        role: registerDto.role,
        hasFirstName: !!registerDto.firstName,
        hasLastName: !!registerDto.lastName
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

