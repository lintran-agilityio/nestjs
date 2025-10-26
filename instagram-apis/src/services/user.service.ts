// libs
import { Op } from "sequelize";

import { Comment, Post, User } from "@/models";
import { IUser } from "@/types";
import { findAllData, omitField } from "@/utils";

class UserServices {
  /**
   * Get all users with pagination
   * @param offset - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise with paginated user data
   */
  getAll = async (offset: number, limit: number) => {
    try {
      return await findAllData({
        model: User,
        offset,
        limit,
        order: ['createdAt', 'DESC'],
        fieldOmit: "password"
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get user by ID
   * @param userId - The user ID to find
   * @returns Promise<IUser | null> - User data without password, or null if not found
   */
  getUserById = async (userId: number) => {
    try {
      const res = await User.findByPk(userId);
      return res ? omitField(res.toJSON(), 'password') : null;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update user information by ID
   * @param userId - The user ID to update
   * @param username - New username
   * @param email - New email
   * @param isAdmin - New admin status
   * @returns Promise<number> - Number of affected rows
   */
  updateUserById = async (userId: number, username: string, email: string, isAdmin: boolean) => {

    try {
      const res = await User.update(
        { username, email, isAdmin },
        { where: { userId } }
      );

      return res[0];
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check if email exists for other users (excluding current user)
   * @param userId - Current user ID to exclude from check
   * @param email - Email to check
   * @returns Promise<User | null> - User with conflicting email if found, null otherwise
   */
  checkExistingEmail = async (userId: number, email: string) => {
    try {
      return await User.findOne({
        where: {
          email,
          userId: { [Op.ne]: userId },
        },
      });
    } catch (error: unknown) {
      throw error
    }
  };

  /**
   * Check for email conflicts among multiple users
   * @param users - Array of users to check
   * @param userEmails - Array of emails to validate
   * @returns Promise<Array> - Array of conflicting email data
   */
  checkExistingEmails = async (users: IUser[], userEmails: string[]) => {
    try {
      const existingEmailData = await User.findAll({
        where: {
          email: { [Op.in]: userEmails }
        },
        attributes: ["userId", "email"]
      });

      const conflictEmail = [];

      for (const user of users) {
        for (const dataUser of existingEmailData) {
          if (dataUser.email === user.email && dataUser.userId !== user.userId) {
            conflictEmail.push({ email: user.email, userId: dataUser.userId });
          }
        }
      }

      return conflictEmail;
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Update multiple users
   * @param usersUpdate - Array of user data to update
   * @returns Promise<IUser[]> - Array of updated users
   */
  updateUsers = async(usersUpdate: IUser[]) => {
    try {
      const usersUpdated: IUser[] = [];

      for (const userData of usersUpdate) {
        const {
          userId,
          email,
          username,
          isAdmin
        } = userData;

        const [count] = await User.update(
          {
            email,
            username,
            isAdmin
          },
          { where: { userId } }
        );
        
        if (count > 0) {
          const userUpdated = await User.findOne({ where: { userId }});

          if (userUpdated) usersUpdated.push(userUpdated);
        }
      }

      return usersUpdated;
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Delete all users and related data (comments and posts)
   * @returns Promise<number> - Number of deleted users
   */
  deleteUsers = async () => {
    try {

      // Delete all table have foreignKey by authorId
      await Comment.destroy({
        where: {}
      });
      await Post.destroy({
        where: {}
      });

      return await User.destroy({
        where: {},
        individualHooks: true
      })
    } catch (error: unknown) {
      throw error;
    }
  };

  /**
   * Delete user by ID
   * @param userId - The user ID to delete
   * @returns Promise<number> - Number of deleted users
   */
  deleteUserById = async (userId: number) => {
    try {
      return await User.destroy({ where: { userId }});
    } catch (error: unknown) {
      throw error;
    }
  }
};

export const userServices = new UserServices();
