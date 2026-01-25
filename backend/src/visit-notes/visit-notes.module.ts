import { Module } from '@nestjs/common';
import { VisitNotesService } from './visit-notes.service';
import { VisitNotesController } from './visit-notes.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DoctorsModule, NotificationsModule],
  controllers: [VisitNotesController],
  providers: [VisitNotesService],
  exports: [VisitNotesService],
})
export class VisitNotesModule {}

