import { Module } from '@nestjs/common';
import { LabRecordsService } from './lab-records.service';
import { LabRecordsController } from './lab-records.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LabRecordsController],
  providers: [LabRecordsService],
  exports: [LabRecordsService],
})
export class LabRecordsModule {}





