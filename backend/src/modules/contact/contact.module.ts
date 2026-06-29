import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController, AdminContactController } from './contact.controller';

@Module({
  controllers: [ContactController, AdminContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
