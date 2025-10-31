// Libs
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { AppLoggerService } from './logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLoggerService],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);

    // Spy on Logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLoggerName', () => {
    it('should return a Logger instance with the provided context', () => {
      const context = 'TestContext';
      const logger = service.getLoggerName(context);

      expect(logger).toBeInstanceOf(Logger);
      expect(logger['context']).toBe(context);
    });

    it('should return different Logger instances for different contexts', () => {
      const context1 = 'Context1';
      const context2 = 'Context2';

      const logger1 = service.getLoggerName(context1);
      const logger2 = service.getLoggerName(context2);

      expect(logger1).not.toBe(logger2);
      expect(logger1['context']).toBe(context1);
      expect(logger2['context']).toBe(context2);
    });
  });

  describe('log', () => {
    it('should log a message using the internal logger', () => {
      const message = 'Test log message';

      service.log(message);

      expect(loggerSpy).toHaveBeenCalledWith(message);
    });

    it('should handle empty string messages', () => {
      const message = '';

      service.log(message);

      expect(loggerSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('error', () => {
    it('should log an error message with trace', () => {
      const message = 'Test error message';
      const trace = 'Error trace stack';
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      service.error(message, trace);

      expect(errorSpy).toHaveBeenCalledWith(message, trace);
    });

    it('should log an error message without trace', () => {
      const message = 'Test error message';
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      service.error(message);

      expect(errorSpy).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('warn', () => {
    it('should log a warning message', () => {
      const message = 'Test warning message';

      service.warn(message);

      expect(loggerSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('debug', () => {
    it('should debug a message using the internal logger', () => {
      const message = 'Test debug message';
      const debugSpy = jest
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation();

      service.debug(message);

      expect(debugSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('verbose', () => {
    it('should log a verbose message using the internal logger', () => {
      const message = 'Test verbose message';
      const verboseSpy = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation();

      service.verbose(message);

      expect(verboseSpy).toHaveBeenCalledWith(message);
    });
  });
});
