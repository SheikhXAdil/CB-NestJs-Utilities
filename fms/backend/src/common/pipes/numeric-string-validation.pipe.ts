import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, z } from 'zod';

export class PositiveNumericQueryParamValidationPipe implements PipeTransform {
  constructor() {}

  schema: ZodSchema = z.coerce.number().positive();

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      if (value) {
        const parsedValue = this.schema.parse(value);
        return String(parsedValue);
      } else {
        return value;
      }
    } catch (error) {
      throw new BadRequestException('Query param should be positive');
    }
  }
}

export class LocationCoordinateQueryParamValidationPipe
  implements PipeTransform
{
  constructor() {}

  schema: ZodSchema = z.coerce.number();

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      if (value === 'null') {
        return null;
      } else if (value) {
        const parsedValue = this.schema.parse(value);
        return parsedValue;
      } else {
        return value;
      }
    } catch (error) {
      throw new BadRequestException('Query param should be number');
    }
  }
}
