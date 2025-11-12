import {
  getBodyFieldValue,
  getSelectFields,
  chunkArray,
  isPlainObject,
  updateObjectFields,
} from '../objects.utils';

describe('getBodyFieldValue', () => {
  it('returns string values unchanged', () => {
    const body = { title: 'Example' };
    expect(getBodyFieldValue(body, 'title')).toBe('Example');
  });

  it('converts numeric values to strings', () => {
    const body = { count: 42 };
    expect(getBodyFieldValue(body, 'count')).toBe('42');
  });

  it('returns undefined for unsupported value types', () => {
    const body = { meta: { id: 1 } };
    expect(getBodyFieldValue(body, 'meta')).toBeUndefined();
    expect(getBodyFieldValue(body, 'missing')).toBeUndefined();
  });
});

describe('getSelectFields', () => {
  it('returns keys where value is true', () => {
    const select = { id: true, email: false, name: true };
    expect(getSelectFields(select)).toEqual(['id', 'name']);
  });

  it('returns empty array when no fields selected', () => {
    expect(getSelectFields({ id: false })).toEqual([]);
  });
});

describe('chunkArray', () => {
  it('splits array into equal chunks when divisible', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('handles arrays with a remainder chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns the entire array as single chunk when chunk size exceeds length', () => {
    expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
  });
});

describe('isPlainObject', () => {
  it('returns true for object literals', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ name: 'Test' })).toBe(true);
  });

  it('returns false for null, arrays, and other primitives', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject('string')).toBe(false);
  });
});

describe('updateObjectFields', () => {
  interface Sample {
    name: string;
    age: number;
    active: boolean;
    nickname?: string | null;
  }

  it('applies defined updates and preserves falsy values', () => {
    const original: Sample = {
      name: 'Alice',
      age: 30,
      active: true,
      nickname: null,
    };
    const updates: Partial<Sample> = {
      age: 0,
      active: false,
      nickname: undefined,
    };

    const result = updateObjectFields({ ...original }, updates);

    expect(result.age).toBe(0);
    expect(result.active).toBe(false);
    expect(result.nickname).toBeNull();
  });

  it('returns the same target reference after applying updates', () => {
    const target: Sample = { name: 'Bob', age: 25, active: true };
    const updated = updateObjectFields(target, { name: 'Bobby' });

    expect(updated).toBe(target);
    expect(target.name).toBe('Bobby');
  });

  it('updates class instances without requiring an index signature', () => {
    class PostEntity {
      slug = 'old-slug';
      title = 'Old title';
      contents = 'Content';
      authorId = 'author-id';
    }

    const post = new PostEntity();

    const updates: Partial<PostEntity> = {
      title: 'Updated title',
      contents: 'Updated content',
    };

    const result = updateObjectFields(post, updates);

    expect(result.title).toBe('Updated title');
    expect(result.contents).toBe('Updated content');
    expect(result.slug).toBe('old-slug');
    expect(result.authorId).toBe('author-id');
  });
});
