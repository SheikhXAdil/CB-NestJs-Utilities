import { Module } from '@nestjs/common';
import { HashService } from './services/hash/hash.service';

@Module({
  providers: [HashService],
  exports: [HashService],
})
export class EncryptionModule {}
