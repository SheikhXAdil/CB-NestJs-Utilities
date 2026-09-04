import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export enum AllowedFileTypes {
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  png = 'image/png',
  webp = 'image/webp',
  pdf = 'application/pdf',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export const ImageTypesArr = [
  AllowedFileTypes.jpeg,
  AllowedFileTypes.jpg,
  AllowedFileTypes.png,
  AllowedFileTypes.webp,
];
export const DocTypesArr = [AllowedFileTypes.pdf, AllowedFileTypes.docx];

export const ImageDocTypesArr = [...ImageTypesArr, ...DocTypesArr];

export const MaxImageSize = 20 * 1024 * 1024; // 20 MB
export const MaxDocSize = 20 * 1024 * 1024; // 20 MB

export const FileValidationConfigSchema = z.object({
  fieldName: z.string(), // Name of the field (e.g., 'image', 'document')
  maxSize: z.number().nonnegative(), // Maximum file size in bytes
  allowedTypes: z.array(z.nativeEnum(AllowedFileTypes)), // List of allowed MIME types
  optional: z.boolean().optional().default(false), // Whether the field is optional (default: false)
});

export class FileValidationConfigDto extends createZodDto(
  FileValidationConfigSchema,
) {}
