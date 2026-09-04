import { Inject, Logger } from '@nestjs/common';

export class BaseLogger {
  @Inject()
  private readonly logger: Logger;

  logError(name: string, message: string) {
    this.logger.fatal(`Error in ${name}`);
    this.logger.error(message);
  }
}
