import { Comment } from '@app/apis/comments/entities';
import { mockingPostUuid } from './mocking-posts-data.mock';
import { mockUuidUser } from './mocking-user-data.mock';

export const mockingCommentUuid = '33333333-3333-3333-3333-333333333333';

export const mockingCommentInfo: Comment = Object.assign(new Comment(), {
  id: mockingCommentUuid,
  content: 'Nice post!',
  postId: mockingPostUuid,
  userId: mockUuidUser,
  createdAt: new Date(),
  updatedAt: new Date(),
} as Partial<Comment>);
