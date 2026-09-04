import { Module } from '@nestjs/common';
import { UsersService } from './services/users/users.service';
import { UsersController } from './controllers/users/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EncryptionModule,
    AuthModule,
    EmailModule,
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CaslAbilityFactory],
  exports: [UsersService],
})
export class UsersModule {}
