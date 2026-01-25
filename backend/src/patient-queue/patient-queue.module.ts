import { Module } from '@nestjs/common';
import { PatientQueueService } from './patient-queue.service';
import { PatientQueueController } from './patient-queue.controller';

@Module({
  controllers: [PatientQueueController],
  providers: [PatientQueueService],
  exports: [PatientQueueService],
})
export class PatientQueueModule {}



