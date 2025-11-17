import {
  getBodyFieldValue,
  getSelectFields,
  chunkArray,
} from '@app/shared/utils/objects.utils';

describe('Objects Utils', () => {
  describe('getBodyFieldValue', () => {
    it('should return string value when field exists and is a string', () => {
      const body = { name: 'John', age: '30' };
      expect(getBodyFieldValue(body, 'name')).toBe('John');
      expect(getBodyFieldValue(body, 'age')).toBe('30');
    });

    it('should convert number to string when field value is a number', () => {
      const body = { age: 30, count: 42 };
      expect(getBodyFieldValue(body, 'age')).toBe('30');
      expect(getBodyFieldValue(body, 'count')).toBe('42');
    });

    it('should return undefined when field does not exist', () => {
      const body = { name: 'John' };
      expect(getBodyFieldValue(body, 'email')).toBeUndefined();
    });

    it('should return undefined when field value is not a string or number', () => {
      const body = {
        name: 'John',
        isActive: true,
        data: { key: 'value' },
        tags: ['tag1', 'tag2'],
        nothing: null,
      };

      expect(getBodyFieldValue(body, 'isActive')).toBeUndefined();
      expect(getBodyFieldValue(body, 'data')).toBeUndefined();
      expect(getBodyFieldValue(body, 'tags')).toBeUndefined();
      expect(getBodyFieldValue(body, 'nothing')).toBeUndefined();
    });

    it('should handle empty body', () => {
      const body = {};
      expect(getBodyFieldValue(body, 'anyField')).toBeUndefined();
    });

    it('should handle zero and negative numbers', () => {
      const body = { zero: 0, negative: -5 };
      expect(getBodyFieldValue(body, 'zero')).toBe('0');
      expect(getBodyFieldValue(body, 'negative')).toBe('-5');
    });

    it('should handle floating point numbers', () => {
      const body = { price: 99.99, rate: 0.5 };
      expect(getBodyFieldValue(body, 'price')).toBe('99.99');
      expect(getBodyFieldValue(body, 'rate')).toBe('0.5');
    });
  });

  describe('getSelectFields', () => {
    it('should return array of field names where value is true', () => {
      const selectFields = {
        name: true,
        email: false,
        age: true,
        isActive: false,
      };
      const result = getSelectFields(selectFields);
      expect(result).toEqual(['name', 'age']);
    });

    it('should return empty array when all values are false', () => {
      const selectFields = {
        name: false,
        email: false,
        age: false,
      };
      const result = getSelectFields(selectFields);
      expect(result).toEqual([]);
    });

    it('should return all field names when all values are true', () => {
      const selectFields = {
        name: true,
        email: true,
        age: true,
      };
      const result = getSelectFields(selectFields);
      expect(result).toEqual(['name', 'email', 'age']);
    });

    it('should return empty array when object is empty', () => {
      const selectFields = {};
      const result = getSelectFields(selectFields);
      expect(result).toEqual([]);
    });

    it('should only include fields with explicit true value', () => {
      const selectFields = {
        field1: true,
        field2: true,
        field3: false,
        field4: true,
      };
      const result = getSelectFields(selectFields);
      expect(result).toEqual(['field1', 'field2', 'field4']);
      expect(result).not.toContain('field3');
    });
  });

  describe('chunkArray', () => {
    const numberArray = [1, 2, 3];

    it('should split array into chunks of specified size', () => {
      const array = numberArray.concat([4, 5, 6, 7, 8]);
      const result = chunkArray(array, 3);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8],
      ]);
    });

    it('should return empty array when input is empty', () => {
      const array: number[] = [];
      const result = chunkArray(array, 3);
      expect(result).toEqual([]);
    });

    it('should handle chunk size larger than array length', () => {
      const result = chunkArray(numberArray, 10);
      expect(result).toEqual([numberArray]);
    });

    it('should handle chunk size equal to array length', () => {
      const array = [1, 2, 3, 4];
      const result = chunkArray(array, 4);
      expect(result).toEqual([[1, 2, 3, 4]]);
    });

    it('should handle chunk size of 1', () => {
      const result = chunkArray(numberArray, 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should work with string arrays', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const result = chunkArray(array, 2);
      expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('should work with object arrays', () => {
      const array = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const result = chunkArray(array, 2);
      expect(result).toEqual([
        [{ id: 1 }, { id: 2 }],
        [{ id: 3 }, { id: 4 }],
      ]);
    });

    it('should handle array with exactly divisible length', () => {
      const array = numberArray.concat([4, 5, 6]);
      const result = chunkArray(array, 3);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('should preserve original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      chunkArray(array, 2);
      expect(array).toEqual(original);
    });
  });
});
