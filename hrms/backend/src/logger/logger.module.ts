import { Global, Logger, Module, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Global()
@Module({
  providers: [
    {
      provide: Logger,
      scope: Scope.TRANSIENT,
      inject: [INQUIRER],
      useFactory: (parentClass: object) =>
        new Logger(parentClass.constructor.name),
    },
  ],
  exports: [Logger],
})
export class LoggerModule {}
