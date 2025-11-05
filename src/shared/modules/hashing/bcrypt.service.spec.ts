// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { BcryptService } from './bcrypt.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptService],
    }).compile();

    service = module.get<BcryptService>(BcryptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a string successfully', async () => {
      const testData = 'test-password';
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hashed-value';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.hash(testData);

      expect(result).toBe(mockHash);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(8);
      expect(bcrypt.hash).toHaveBeenCalledWith(testData, mockSalt);
    });

    it('should hash a Buffer successfully', async () => {
      const testData = Buffer.from('test-password');
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hashed-value';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.hash(testData);

      expect(result).toBe(mockHash);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(8);
      expect(bcrypt.hash).toHaveBeenCalledWith(testData.toString(), mockSalt);
    });

    it('should handle genSalt errors', async () => {
      const testData = 'test-password';
      const error = new Error('GenSalt failed');

      (bcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await expect(service.hash(testData)).rejects.toThrow('GenSalt failed');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should handle hash errors', async () => {
      const testData = 'test-password';
      const mockSalt = 'mock-salt';
      const error = new Error('Hash failed');

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(service.hash(testData)).rejects.toThrow('Hash failed');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(8);
      expect(bcrypt.hash).toHaveBeenCalledWith(testData, mockSalt);
    });
  });

  describe('compare', () => {
    it('should compare a string successfully when values match', async () => {
      const testData = 'test-password';
      const hash = 'hashed-value';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.compare(testData, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(testData, hash);
    });

    it('should compare a string successfully when values do not match', async () => {
      const testData = 'test-password';
      const hash = 'hashed-value';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.compare(testData, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(testData, hash);
    });

    it('should compare a Buffer successfully', async () => {
      const testData = Buffer.from('test-password');
      const hash = 'hashed-value';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.compare(testData, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(testData.toString(), hash);
    });

    it('should handle compare errors', async () => {
      const testData = 'test-password';
      const hash = 'hashed-value';
      const error = new Error('Compare failed');

      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(service.compare(testData, hash)).rejects.toThrow(
        'Compare failed',
      );
    });
  });
});
