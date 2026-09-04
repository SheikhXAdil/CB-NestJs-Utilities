import { HttpStatus } from '@nestjs/common';

export const getErrorStatusCode = (err): number => {
  return err.status && typeof err.status === 'function'
    ? err.status()
    : HttpStatus.INTERNAL_SERVER_ERROR;
};
