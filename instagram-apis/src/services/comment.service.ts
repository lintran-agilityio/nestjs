import { Comment, Post, User } from '@/models';

type ParamCreateCommentType = {
  postId: number;
  authorId: number;
  content: string;
};

class CommentsServices {
  /**
   * Get comments for a specific post with pagination and related data
   * @param offset - Number of records to skip
   * @param limit - Maximum number of records to return
   * @param postId - The post ID to get comments for
   * @returns Promise with paginated comment data including post and author information
   */
  getPostsComment = async (offset: number, limit: number, postId: number) => {
    try {
      const { rows, count } = await Comment.findAndCountAll({
        where: { postId },
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title'],
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['userId', 'username', 'email'],
              },
            ],
          },
        ],
      });

      const resFormatted = {
        data: rows,
        meta: {
          pagination: {
            limit,
            offset,
            total: count,
          },
        },
      };

      return resFormatted;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get a specific comment by ID for a specific post
   * @param commentId - The comment ID to find
   * @param postId - The post ID the comment belongs to
   * @returns Promise<Comment | null> - Comment with post information if found, null otherwise
   */
  getPostsCommentById = async (commentId: number, postId: number) => {
    try {
      return await Comment.findOne({
        where: {
          id: commentId,
          postId,
        },
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title'],
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create a new comment
   * @param postId - The post ID to comment on
   * @param authorId - The user ID of the comment author
   * @param content - The comment content
   * @returns Promise<Comment> - Created comment
   */
  create = async ({ postId, authorId, content }: ParamCreateCommentType) => {
    try {
      return await Comment.create({ postId, authorId, content });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete all comments for a specific post
   * @param postId - The post ID to delete comments for
   * @returns Promise<number> - Number of deleted comments
   */
  deletePostsComments = async (postId: number) => {
    try {
      return await Comment.destroy({
        where: { postId },
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete a specific comment by ID for a specific post
   * @param postId - The post ID the comment belongs to
   * @param commentId - The comment ID to delete
   * @returns Promise<number> - Number of deleted comments
   */
  deletePostsCommentById = async (postId: number, commentId: number) => {
    try {
      return await Comment.destroy({
        where: { postId, id: commentId },
      });
    } catch (error) {
      throw error;
    }
  };
}

export const commentServices = new CommentsServices();
