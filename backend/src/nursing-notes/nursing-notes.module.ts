import { Module } from '@nestjs/common';
import { NursingNotesService } from './nursing-notes.service';
import { NursingNotesController } from './nursing-notes.controller';

@Module({
  controllers: [NursingNotesController],
  providers: [NursingNotesService],
  exports: [NursingNotesService],
})
export class NursingNotesModule {}



