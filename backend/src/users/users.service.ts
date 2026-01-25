import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      // Admin-created users are automatically approved, self-registered users need approval
      const isApproved = data.isApproved !== undefined ? data.isApproved : false;
      
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role,
          cnic: data.cnic || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          isApproved: isApproved,
          profileCompleted: data.profileCompleted !== undefined ? data.profileCompleted : false,
        },
      });

      // Create role-specific profile
      try {
        if (data.role === UserRole.DOCTOR) {
          await this.prisma.doctor.create({
            data: {
              userId: user.id,
              specialization: data.specialization || null,
              licenseNumber: data.licenseNumber || null,
              department: data.department || null,
            },
          });
        } else if (data.role === UserRole.NURSE) {
          await this.prisma.nurse.create({
            data: {
              userId: user.id,
              department: data.department || null,
              licenseNumber: data.licenseNumber || null,
            },
          });
        } else if (data.role === UserRole.PATIENT) {
          await this.prisma.patient.create({
            data: {
              userId: user.id,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
              gender: data.gender || null,
              address: data.address || null,
            },
          });
        }
      } catch (profileError) {
        // If profile creation fails, delete the user to maintain consistency
        await this.prisma.user.delete({ where: { id: user.id } });
        throw profileError;
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createWithProfile(data: any) {
    // This is the same as create, but kept for clarity
    return this.create(data);
  }

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isApproved: true,
        createdAt: true,
      },
    });
  }

  async findPendingApprovals() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          isApproved: false,
          isActive: true,
          profileCompleted: true, // Only show users who completed their profile
        },
        include: {
          doctorProfile: true,
          nurseProfile: true,
          patientProfile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Filter out any users that might have been deleted or have invalid data
      return users.filter(user => user && user.id);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw new InternalServerErrorException('Failed to fetch pending approvals');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          doctorProfile: true,
          nurseProfile: true,
          patientProfile: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle Prisma errors
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      console.error('Error finding user:', error);
      // Return a proper HTTP exception instead of generic Error
      throw new InternalServerErrorException(`Failed to find user: ${error.message}`);
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        nurseProfile: true,
        patientProfile: true,
      },
    });
  }

  async findByRole(role: string) {
    return this.prisma.user.findMany({
      where: { role: role as any },
    });
  }

  async update(id: string, data: any) {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });
      
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      // Convert dateOfBirth string to Date object if provided
      const updateData = { ...data };
      if (updateData.dateOfBirth !== undefined) {
        updateData.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
      }
      
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      console.error('Error updating user:', error);
      throw new InternalServerErrorException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Use transaction to ensure atomic deletion
      // Prisma cascade will automatically delete related profiles (doctor, nurse, patient)
      // due to onDelete: Cascade in schema
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error(`Error deleting user ${id}:`, error);
      // If direct delete fails due to foreign key constraints, try explicit cascade
      if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
        // Try to delete related records first
        try {
          // Delete patient profile if exists
          await this.prisma.patient.deleteMany({ where: { userId: id } }).catch(() => {});
          // Delete doctor profile if exists
          await this.prisma.doctor.deleteMany({ where: { userId: id } }).catch(() => {});
          // Delete nurse profile if exists
          await this.prisma.nurse.deleteMany({ where: { userId: id } }).catch(() => {});
          // Now delete user
          return await this.prisma.user.delete({ where: { id } });
        } catch (nestedError: any) {
          console.error('Error in cascading delete:', nestedError);
          throw nestedError;
        }
      }
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password length
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

