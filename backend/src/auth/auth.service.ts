import { Injectable, UnauthorizedException, Optional, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private auditService: any;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  setAuditService(auditService: any) {
    this.auditService = auditService;
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
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

  async register(registerDto: any) {
    try {
      // Check if trying to register as ADMIN and admin already exists
      if (registerDto.role === 'ADMIN') {
        const existingAdmin = await this.usersService.findByRole('ADMIN');
        if (existingAdmin && existingAdmin.length > 0) {
          throw new Error('Admin user already exists. Only one admin is allowed in the system.');
        }
      }

      // Check if user with this email already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email?.trim());
      if (existingUser) {
        // If user exists and is approved, don't allow re-registration
        if (existingUser.isApproved) {
          throw new Error('An account with this email already exists and is approved. Please login instead.');
        }
        
        // If user exists but is not approved and profile not completed, delete old record and allow re-registration
        if (!existingUser.isApproved && !existingUser.profileCompleted) {
          console.log(`Removing existing unapproved user with email: ${registerDto.email} (profile not completed) to allow re-registration`);
          try {
            // Delete the existing user (cascade will handle related profiles automatically)
            await this.usersService.remove(existingUser.id);
            console.log(`Successfully removed existing user: ${registerDto.email}`);
            
            // Small delay to ensure database transaction commits
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (deleteError: any) {
            console.error('Error deleting existing user:', deleteError);
            // If it's a foreign key constraint error, provide helpful message
            if (deleteError.code === 'P2003' || deleteError.message?.includes('Foreign key constraint')) {
              throw new Error('Unable to remove existing account due to related data. Please contact admin for assistance.');
            }
            throw new Error(deleteError.message || 'An account with this email already exists. Please contact admin if you need help.');
          }
        } else if (!existingUser.isApproved && existingUser.profileCompleted) {
          // Profile completed but not approved - don't allow re-registration (waiting for admin approval)
          throw new Error('An account with this email already exists and is pending admin approval. Please wait for approval or contact support.');
        }
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      // Admin users are automatically approved, others need approval
      const isApproved = registerDto.role === 'ADMIN' ? true : (registerDto.isApproved !== undefined ? registerDto.isApproved : false);
      
      // Prepare user data - only basic fields from registration
      const userData = {
        email: registerDto.email?.trim(),
        password: hashedPassword,
        firstName: registerDto.firstName?.trim(),
        lastName: registerDto.lastName?.trim(),
        phone: registerDto.phone?.trim() || null,
        role: registerDto.role,
        cnic: null, // Will be filled in settings
        dateOfBirth: null, // Will be filled in settings
        gender: null, // Will be filled in settings
        isApproved,
        profileCompleted: false, // Profile not completed yet - will be set to true when user fills profile form
      };

      // Create user with empty role-specific profile (will be filled in settings)
      const user = await this.usersService.createWithProfile({
        ...userData,
        // Role-specific data - all null initially, will be filled in settings
        specialization: null,
        licenseNumber: null,
        department: null,
      });
      
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
      // Log more details for debugging
      if (error.code) {
        console.error('Prisma error code:', error.code);
      }
      if (error.meta) {
        console.error('Prisma error meta:', error.meta);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      throw new Error(error.message || 'Registration failed');
    }
  }
}

