import 'jest';

import { toError } from '@/utils/error';

describe('Error Utils', () => {
  describe('toError', () => {
    it('Should return the same Error instance when input is already an Error', () => {
      const originalError = new Error('Test error message');
      const result = toError(originalError);

      expect(result).toBe(originalError);
      expect(result.message).toBe('Test error message');
    });

    it('Should create new Error from string input', () => {
      const errorMessage = 'String error message';
      const result = toError(errorMessage);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: String error message');
    });

    it('Should create new Error from number input', () => {
      const numberValue = 42;
      const result = toError(numberValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: 42');
    });

    it('Should create new Error from boolean input', () => {
      const booleanValue = true;
      const result = toError(booleanValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: true');
    });

    it('Should create new Error from object input', () => {
      const objectValue = { key: 'value', number: 123 };
      const result = toError(objectValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: {"key":"value","number":123}');
    });

    it('Should create new Error from array input', () => {
      const arrayValue = [1, 'two', { three: 3 }];
      const result = toError(arrayValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: [1,"two",{"three":3}]');
    });

    it('Should create new Error from null input', () => {
      const nullValue = null;
      const result = toError(nullValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: null');
    });

    it('Should create new Error from undefined input', () => {
      const undefinedValue = undefined;
      const result = toError(undefinedValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Non-Error thrown: undefined');
    });

    it('Should handle circular reference objects gracefully', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      const result = toError(circularObj);

      expect(result).toBeInstanceOf(Error);
      // Should handle circular reference and not crash
      expect(result.message).toContain('Non-Error thrown:');
    });

    it('Should handle function input', () => {
      const functionValue = () => 'test function';
      const result = toError(functionValue);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Non-Error thrown:');
    });

    it('Should handle complex nested objects', () => {
      const complexObj = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              language: 'en'
            }
          }
        },
        settings: {
          notifications: true,
          privacy: {
            public: false,
            friendsOnly: true
          }
        }
      };

      const result = toError(complexObj);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Non-Error thrown:');
      expect(result.message).toContain('John');
      expect(result.message).toContain('dark');
    });
  });
});
