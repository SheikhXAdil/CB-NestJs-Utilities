import {
  Injectable,
  PipeTransform,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AllowedFileTypes, FileValidationConfigDto } from '../dto/files.dto';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly validationConfigs: FileValidationConfigDto[]) {}

  transform(files: Record<string, MemoryStorageFile[]>) {
    for (const config of this.validationConfigs) {
      const fieldFiles = files[config.fieldName];

      if (!fieldFiles || fieldFiles.length === 0) {
        if (!config.optional) {
          throw new NotFoundException(
            `${config.fieldName} is required to upload!`,
          );
        }
        // Skip validation for optional fields that are not provided
        continue;
      }

      for (const file of fieldFiles) {
        if (file.size > config.maxSize) {
          throw new BadRequestException(
            `${config.fieldName} size should not exceed ${config.maxSize / (1024 * 1024)} MB`,
          );
        }

        if (!config.allowedTypes.includes(file.mimetype as AllowedFileTypes)) {
          throw new BadRequestException(
            `${config.fieldName} should be one of the following types: ${config.allowedTypes.join(', ')}`,
          );
        }
      }
    }

    return files;
  }
}
