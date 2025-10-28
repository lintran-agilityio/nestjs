import { generateDeleteMessage } from '../generate-messages.utils';

describe('Filter Utils', () => {
  describe('Function generateDeleteMessage', () => {
    const entity = 'post';

    it('Generate delete message with No Post for delete', () => {
      expect(generateDeleteMessage(entity, 0, 1)).toBe(
        'No post were deleted as none were found',
      );
    });

    it('Generate delete message with delete successfully with only one id', () => {
      const deletedCount = 1;
      const notFoundCount = 0;

      expect(generateDeleteMessage(entity, deletedCount, notFoundCount)).toBe(
        `Successfully deleted ${deletedCount} ${entity}`,
      );
    });

    it('Generate delete message with delete successfully with multiple id', () => {
      const deletedCount = 2;
      const notFoundCount = 0;

      expect(generateDeleteMessage(entity, deletedCount, notFoundCount)).toBe(
        `Successfully deleted ${deletedCount} ${entity}s`,
      );
    });

    it('Generate delete message with deleted one id and include id can not delete', () => {
      const deletedCount = 1;
      const notFoundCount = 1;

      expect(generateDeleteMessage(entity, deletedCount, notFoundCount)).toBe(
        `Deleted ${deletedCount} ${entity}, ${notFoundCount} ${entity} was not found`,
      );
    });

    it('Generate delete message with deleted multiple id and include multiple id can not delete', () => {
      const deletedCount = 2;
      const notFoundCount = 2;

      expect(generateDeleteMessage(entity, deletedCount, notFoundCount)).toBe(
        'Deleted 2 posts, 2 posts were not found',
      );
    });
  });
});
