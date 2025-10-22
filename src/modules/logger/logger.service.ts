import { Logger, LoggerService } from '@nestjs/common';

export class AppLoggerService implements LoggerService {
  private context = 'AppLogger';
  private logger = new Logger(this.context);

  getLoggerName(context: string): LoggerService {
    // this.context = context;
    // this.logger = new Logger(context);
    return new Logger(context);
  }

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
