import { Logger, LoggerService } from '@nestjs/common';

export class AppLoggerService implements LoggerService {
  private logger = new Logger('AppLogger');

  getLoggerName(context: string): LoggerService {
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
