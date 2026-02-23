import { Injectable, UnauthorizedException, Optional, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private auditService: any;
  private verifiedEmails: Map<string, Date> = new Map(); // Store verified emails temporarily

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService,
  ) {}

  setAuditService(auditService: any) {
    this.auditService = auditService;
  }

  async validateUser(email: string, password: string, role?: string): Promise<any> {
    try {
      const user = role
        ? await this.usersService.findByEmailAndRole(email, role)
        : await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }
      if (user && (await bcrypt.compare(password, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error validating user:', error);
      throw error;
    }
  }

  async login(user: any, ipAddress?: string, userAgent?: string) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);
    
    // Log login activity
    if (this.auditService) {
      this.auditService.logActivity({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        description: `User logged in: ${user.email}`,
        ipAddress,
        userAgent,
      });
    }

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
        profileCompleted: user.profileCompleted || false,
      },
    };
  }

  async sendOtp(email: string) {
    try {
      console.log('sendOtp called with email:', email);
      
      // Validate email format
      if (!email || !email.trim()) {
        throw new BadRequestException('Email is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new BadRequestException('Please provide a valid email address');
      }

      // Check rate limiting
      const rateLimitCheck = this.otpService.canRequestOtp(email.trim());
      if (!rateLimitCheck.allowed) {
        const minutesLeft = Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 60000);
        throw new BadRequestException(
          `Too many OTP requests. Please try again in ${minutesLeft} minute(s).`
        );
      }

      // Allow OTP for any valid email (same email can register for different roles)

      // Generate and store OTP
      const otp = this.otpService.generateOtp();
      console.log('Generated OTP for email:', email.trim());
      this.otpService.storeOtp(email.trim(), otp);
      this.otpService.recordOtpRequest(email.trim());

      // Send OTP to user's email only (no dummy/on-screen code)
      await this.emailService.sendOtpEmail(email.trim(), otp);
      console.log('OTP email sent successfully to', email.trim());

      return {
        message: 'Verification code sent to your email. Please check your inbox.',
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error sending OTP:', error);
      console.error('Error stack:', error.stack);
      throw new BadRequestException(error.message || 'Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp(email: string, otp: string) {
    try {
      // Verify OTP
      const isValid = this.otpService.verifyOtp(email.trim(), otp);
      
      if (!isValid) {
        throw new BadRequestException('Invalid or expired OTP code. Please request a new one.');
      }

      // Mark email as verified (valid for 30 minutes)
      const verifiedUntil = new Date();
      verifiedUntil.setMinutes(verifiedUntil.getMinutes() + 30);
      this.verifiedEmails.set(email.trim(), verifiedUntil);

      // Clean up expired verifications
      this.cleanupVerifiedEmails();

      return {
        message: 'Email verified successfully',
        verified: true,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error verifying OTP:', error);
      throw new BadRequestException('Failed to verify OTP. Please try again.');
    }
  }

  private cleanupVerifiedEmails() {
    const now = new Date();
    for (const [email, expiresAt] of this.verifiedEmails.entries()) {
      if (now > expiresAt) {
        this.verifiedEmails.delete(email);
      }
    }
  }

  private isEmailVerified(email: string): boolean {
    const verifiedUntil = this.verifiedEmails.get(email.trim());
    if (!verifiedUntil) {
      return false;
    }
    if (new Date() > verifiedUntil) {
      this.verifiedEmails.delete(email.trim());
      return false;
    }
    return true;
  }

  async register(registerDto: any) {
    try {
      // Check if email is verified
      if (!this.isEmailVerified(registerDto.email?.trim())) {
        throw new BadRequestException('Please verify your email address first by entering the OTP code.');
      }

      // Check if trying to register as ADMIN and admin already exists
      if (registerDto.role === 'ADMIN') {
        const existingAdmin = await this.usersService.findByRole('ADMIN');
        if (existingAdmin && existingAdmin.length > 0) {
          throw new Error('Admin user already exists. Only one admin is allowed in the system.');
        }
      }

      // Check if user with this email AND role already exists (same email can have different roles)
      const existingUser = await this.usersService.findByEmailAndRole(
        registerDto.email?.trim(),
        registerDto.role,
      );
      if (existingUser) {
        if (existingUser.isApproved) {
          throw new Error(`An account with this email is already registered as ${existingUser.role}. Please login as ${existingUser.role} instead.`);
        }
        if (!existingUser.isApproved && !existingUser.profileCompleted) {
          console.log(`Removing existing unapproved user with email: ${registerDto.email} role: ${registerDto.role} to allow re-registration`);
          try {
            await this.usersService.remove(existingUser.id);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (deleteError: any) {
            console.error('Error deleting existing user:', deleteError);
            if (deleteError.code === 'P2003' || deleteError.message?.includes('Foreign key constraint')) {
              throw new Error('Unable to remove existing account due to related data. Please contact admin for assistance.');
            }
            throw new Error(deleteError.message || 'An account with this email and role already exists. Please contact admin if you need help.');
          }
        } else if (!existingUser.isApproved && existingUser.profileCompleted) {
          throw new Error('An account with this email and role is pending admin approval. Please wait for approval or contact support.');
        }
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      // Admin users are automatically approved, others need approval
      const isApproved = registerDto.role === 'ADMIN' ? true : (registerDto.isApproved !== undefined ? registerDto.isApproved : false);
      
      // Use only registration body for name – never from session or elsewhere
      const firstName = (registerDto.firstName != null && String(registerDto.firstName).trim()) ? String(registerDto.firstName).trim() : '';
      const lastName = (registerDto.lastName != null && String(registerDto.lastName).trim()) ? String(registerDto.lastName).trim() : '';
      if (!firstName || !lastName) {
        throw new BadRequestException('First name and last name are required.');
      }
      console.log('Register: saving user with name', { firstName, lastName, role: registerDto.role });
      const userData = {
        email: registerDto.email?.trim(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: registerDto.phone?.trim() || null,
        role: registerDto.role,
        cnic: registerDto.cnic?.trim() || null,
        dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : null,
        gender: registerDto.gender?.trim() || null,
        isApproved,
        profileCompleted: false,
      };

      // Create user with role-specific profile; for PATIENT/DOCTOR/NURSE copy gender/cnic/dateOfBirth into profile where applicable
      const user = await this.usersService.createWithProfile({
        ...userData,
        specialization: null,
        licenseNumber: null,
        department: null,
      });
      
      // Remove email from verified list after successful registration
      this.verifiedEmails.delete(registerDto.email?.trim());
      
      // Return user info (without token) so frontend can auto-login
      return {
        message: registerDto.role === 'ADMIN' 
          ? 'Admin registration successful!' 
          : 'Registration successful. Please complete your profile.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
        },
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A user with this email and role already exists, or the database still has the old unique constraint. Run in backend folder: npx prisma migrate deploy',
        );
      }
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async requestPasswordReset(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('Please provide a valid email address');
    }

    const user = await this.usersService.findByEmail(email.trim());
    if (!user) {
      throw new BadRequestException('No account found with this email address.');
    }

    const rateLimitCheck = this.otpService.canRequestOtp(email.trim());
    if (!rateLimitCheck.allowed) {
      const minutesLeft = Math.ceil((rateLimitCheck.resetAt!.getTime() - Date.now()) / 60000);
      throw new BadRequestException(
        `Too many requests. Please try again in ${minutesLeft} minute(s).`,
      );
    }

    const otp = this.otpService.generateOtp();
    this.otpService.storeOtp(email.trim(), otp);
    this.otpService.recordOtpRequest(email.trim());

    await this.emailService.sendPasswordResetOtpEmail(email.trim(), otp);

    return {
      message: 'Password reset code sent to your email. Please check your inbox.',
      expiresIn: 600,
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }
    if (!otp || !otp.trim()) {
      throw new BadRequestException('Verification code is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const isValid = this.otpService.verifyOtp(email.trim(), otp.trim());
    if (!isValid) {
      throw new BadRequestException('Invalid or expired code. Please request a new one.');
    }

    const user = await this.usersService.findByEmail(email.trim());
    if (!user) {
      throw new BadRequestException('No account found with this email address.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, { password: hashedPassword });

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}

