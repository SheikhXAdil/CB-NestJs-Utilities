import { Module } from '@nestjs/common';
import { NotesService } from './services/notes/notes.service';
import { NotesController } from './controllers/notes/notes.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { Note } from './entities/note.entity';
import { FilesModule } from 'src/files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), FilesModule],
  controllers: [NotesController],
  providers: [NotesService, CaslAbilityFactory],
  exports: [NotesService],
})
export class NotesModule {}
