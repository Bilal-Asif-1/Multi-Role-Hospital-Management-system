import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: {
    title: string;
    description?: string;
    assignedTo: string;
    assignedBy: string;
    priority?: string;
    dueDate?: Date;
    patientId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        assignedBy: data.assignedBy,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate,
        patientId: data.patientId,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for assigned user
    try {
      const dueDateText = data.dueDate 
        ? ` due ${new Date(data.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : '';
      await this.notificationsService.create({
        userId: data.assignedTo,
        title: 'New Task Assigned',
        message: `${task.assigner.firstName} ${task.assigner.lastName} assigned you a new task: "${data.title}"${dueDateText}`,
        type: 'TASK',
        actionUrl: '/nurse',
        relatedEntityType: 'TASK',
        relatedEntityId: task.id,
      });
    } catch (error) {
      console.error('Error creating task notification:', error);
      // Don't fail task creation if notification fails
    }

    return task;
  }

  async findAll(assignedTo?: string, status?: string) {
    const where: any = {};
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;

    return this.prisma.task.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: true,
        assigner: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async markCompleted(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}



