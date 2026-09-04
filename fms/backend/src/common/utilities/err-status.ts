import { HttpStatus } from '@nestjs/common';

export const getErrorStatusCode = (err): number => {
  return err.status ? err.status : HttpStatus.INTERNAL_SERVER_ERROR;
};
