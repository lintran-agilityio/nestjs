import 'jest';

import { omitField } from '@/utils/common';

describe('Common Utils', () => {
  describe('omitField', () => {
    it('Should omit a single field from an object', () => {
      const testObj = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret123'
      };

      const result = omitField(testObj, 'password');

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com'
      });
      expect(result).not.toHaveProperty('password');
    });

    it('Should omit a field from an object with nested properties', () => {
      const testObj = {
        id: 1,
        profile: {
          name: 'John',
          age: 30
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      };

      const result = omitField(testObj, 'profile');

      expect(result).toEqual({
        id: 1,
        settings: {
          theme: 'dark',
          notifications: true
        }
      });
      expect(result).not.toHaveProperty('profile');
    });

    it('Should return the same object structure when omitting non-existent field', () => {
      const testObj = {
        id: 1,
        name: 'John'
      };

      const result = omitField(testObj, 'nonExistent' as keyof typeof testObj);

      expect(result).toEqual(testObj);
    });

    it('Should handle empty object', () => {
      const testObj = {};

      const result = omitField(testObj, 'anyField' as keyof typeof testObj);

      expect(result).toEqual({});
    });

    it('Should handle object with only the field to omit', () => {
      const testObj = { password: 'secret123' };

      const result = omitField(testObj, 'password');

      expect(result).toEqual({});
      expect(result).not.toHaveProperty('password');
    });

    it('Should preserve original object and return new object', () => {
      const testObj = {
        id: 1,
        name: 'John',
        email: 'john@example.com'
      };

      const result = omitField(testObj, 'email');

      // Original object should remain unchanged
      expect(testObj).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com'
      });

      // Result should be a new object
      expect(result).not.toBe(testObj);
    });

    it('Should handle object with undefined values', () => {
      const testObj = {
        id: 1,
        name: undefined,
        email: 'john@example.com'
      };

      const result = omitField(testObj, 'name');

      expect(result).toEqual({
        id: 1,
        email: 'john@example.com'
      });
      expect(result).not.toHaveProperty('name');
    });
  });
});
