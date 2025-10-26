import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../configs/database";

export interface ICommentAttributes {
  id?: number;
  postId: number;
  content: string;
  authorId: number;
};

type CommentCreationAttributesType = Optional<ICommentAttributes, 'id'>;

export class Comment extends Model<ICommentAttributes, CommentCreationAttributesType> implements ICommentAttributes {
  id!: number;
  postId!: number;
  content!: string;
  authorId!: number;
};

Comment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'userId'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'Comments',
  timestamps: true,
});