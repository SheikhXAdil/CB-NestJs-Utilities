import { applyDecorators, Type } from '@nestjs/common';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

/**
 * Combines two DTOs for use with Swagger's @ApiBody.
 * @param dto1 The first DTO class.
 * @param dto2 The second DTO class.
 */
export function ApiFileBody(dto1: any, dto2: any) {
  return applyDecorators(
    ApiExtraModels(dto1, dto2),
    ApiBody({
      schema: {
        allOf: [{ $ref: getSchemaPath(dto1) }, { $ref: getSchemaPath(dto2) }],
      },
    }),
  );
}
