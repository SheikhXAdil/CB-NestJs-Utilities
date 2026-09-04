import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export enum NoteSortKeys {
  id = 'id',
  title = 'title',
  description = 'description',
  createdAt = 'createdAt',
}

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  attachment: z.string(), // file url
});

export const CreateNoteSchema = NoteSchema.omit({
  id: true,
  attachment: true,
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export class NoteDto extends createZodDto(NoteSchema) {}
export class CreateNoteDto extends createZodDto(CreateNoteSchema) {}
export class UpdateNoteDto extends createZodDto(UpdateNoteSchema) {}

export class NoteFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  attachment: MemoryStorageFile[];
}
