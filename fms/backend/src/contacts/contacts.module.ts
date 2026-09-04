import { Module } from '@nestjs/common';
import { ContactsController } from './controllers/contacts/contacts.controller';
import { ContactsService } from './services/contacts/contacts.service';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { Contact } from './entities/contact.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactsController],
  providers: [ContactsService, CaslAbilityFactory],
  exports: [ContactsService],
})
export class ContactsModule {}
