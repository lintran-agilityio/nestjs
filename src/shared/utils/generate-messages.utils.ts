import { MESSAGES } from '../constants';

/**
 * Generate appropriate message based on deletion results
 * Uses TypeScript string templates and conditional logic
 */
export const generateDeleteMessage = (
  entity: string,
  deletedCount: number,
  notFoundCount: number,
): string => {
  if (deletedCount === 0 && notFoundCount > 0) {
    return MESSAGES.DELETE_NO_POST;
  }

  if (deletedCount > 0 && notFoundCount === 0) {
    return `Successfully deleted ${deletedCount} ${entity}${deletedCount === 1 ? '' : 's'}`;
  }

  if (deletedCount > 0 && notFoundCount > 0) {
    return `Deleted ${deletedCount} ${entity}${deletedCount === 1 ? '' : 's'}, ${notFoundCount} ${entity}${notFoundCount === 1 ? ' was' : 's were'} not found`;
  }

  return `No ${entity} were processed`;
};
