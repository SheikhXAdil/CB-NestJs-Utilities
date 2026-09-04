import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  constructor(private readonly configService: ConfigService) {}

  async hashPassword(password: string) {
    const saltOrRounds = this.configService.get('HASH_SALT_ROUNDS');
    return await bcrypt.hash(password, saltOrRounds);
  }

  async comparePassword(password: string, storedHash: string) {
    return await bcrypt.compare(password, storedHash);
  }
}
