import { Module } from '@nestjs/common';
import { ClientsService } from './services/clients/clients.service';
import { ClientsController } from './controllers/clients/clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientsController],
  providers: [ClientsService, CaslAbilityFactory],
  exports: [ClientsService],
})
export class ClientsModule {}
