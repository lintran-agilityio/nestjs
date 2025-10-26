import { MESSAGES_VALIDATION } from '@/constants';
import { Post } from '@/models';
import { IPostAttributes } from '@/models/Post.model';
import { findAllData } from '@/utils';

class PostServices {
  /**
   * Get all posts with pagination
   * @param offset - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise with paginated post data
   */
  getAll = async (offset: number, limit: number) => {
    try {
      return await findAllData({
        model: Post,
        offset,
        limit,
        order: ['createdAt', 'DESC'],
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check if a post with the given slug already exists
   * @param slug - The slug to check
   * @returns Promise<Post | null> - Post if found, null otherwise
   */
  existSlug = async (slug: string) => {
    try {
      return await Post.findOne({ where: { slug } });
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Create a new post
   * @param payload - Post data to create
   * @returns Promise<Post> - Created post
   */
  create = async (payload: IPostAttributes) => {
    try {
      return await Post.create(payload);
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Get post by ID
   * @param postId - The post ID to find
   * @returns Promise<Post | null> - Post if found, null otherwise
   */
  get = async (postId: number) => {
    try {
      return await Post.findByPk(postId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get post by ID and author ID
   * @param userId - The author user ID
   * @param postId - The post ID to find
   * @returns Promise<Post | null> - Post if found and belongs to user, null otherwise
   */
  getPostByAuthorId = async (userId: number, postId: number) => {
    try {
      return await Post.findOne({
        where: {
          id: postId,
          authorId: userId,
        },
      });
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Update an existing post
   * @param post - The post instance to update
   * @param payload - New post data
   * @returns Promise<Object> - Update result with message
   */
  update = async (post: Post, payload: IPostAttributes) => {
    try {
      // validate slug unique
      const existSlugPost = await Post.findOne({
        where: { slug: payload.slug },
      });

      if (existSlugPost) {
        return { message: MESSAGES_VALIDATION.INVALID_SLUG_POST };
      }
      await post.update(payload);

      return { message: '' };
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Delete all posts
   * @returns Promise<number> - Number of deleted posts
   */
  deletePosts = async () => {
    try {
      return await Post.destroy({
        where: {},
        truncate: true,
      });
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Delete a specific post by ID
   * @param postId - The post ID to delete
   * @param currentUserId - Current user ID
   * @param isAdminUser - Whether current user is admin
   * @param userIdNumber - User ID number
   * @returns Promise<number> - Number of deleted posts
   */
  deleteUsersPostById = async (
    postId: number,
    currentUserId: number,
    isAdminUser: boolean,
    userIdNumber: number
  ) => {
    try {
      return await Post.destroy({
        where: { id: postId },
      });
    } catch (error: unknown) {
      throw error;
    }
  };
}

export const postService = new PostServices();
