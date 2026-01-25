import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { VisitNotesModule } from './visit-notes/visit-notes.module';
import { LabRecordsModule } from './lab-records/lab-records.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DoctorsModule } from './doctors/doctors.module';
import { NursesModule } from './nurses/nurses.module';
import { AuditModule } from './audit/audit.module';
import { VitalsModule } from './vitals/vitals.module';
import { NursingNotesModule } from './nursing-notes/nursing-notes.module';
import { TasksModule } from './tasks/tasks.module';
import { PatientQueueModule } from './patient-queue/patient-queue.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RoomsModule } from './rooms/rooms.module';
import { PatientStatesModule } from './patient-states/patient-states.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DepartmentsModule } from './departments/departments.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { SalariesModule } from './salaries/salaries.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { ModuleRef } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    NursesModule,
    PatientsModule,
    AppointmentsModule,
    VisitNotesModule,
    LabRecordsModule,
    PrescriptionsModule,
    InvoicesModule,
    VitalsModule,
    NursingNotesModule,
    TasksModule,
    PatientQueueModule,
    RoomsModule,
    PatientStatesModule,
    ShiftsModule,
    NotificationsModule,
    DepartmentsModule,
    WithdrawalsModule,
    SalariesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    // Inject AuditService into AuthService after modules are initialized
    try {
      const auditService = this.moduleRef.get('AuditService', { strict: false });
      const authService = this.moduleRef.get('AuthService', { strict: false });
      if (authService && auditService) {
        authService.setAuditService(auditService);
      }
    } catch (error) {
      // Ignore if services not available
    }
  }
}

