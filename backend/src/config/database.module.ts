import { Module, Global } from '@nestjs/common';
import { PrismaService } from './database.config';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
