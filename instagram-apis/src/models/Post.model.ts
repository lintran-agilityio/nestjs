import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../configs/database";

export interface IPostAttributes {
  id?: number;
  title: string;
  slug: string;
  content: string;
  authorId: number;
  status: 'draft' | 'published' | 'stored';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
};

type PostCreationAttributesType = Optional<IPostAttributes, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>;

export class Post extends Model<IPostAttributes, PostCreationAttributesType> implements IPostAttributes {
  public id!: number;
  public title!: string;
  public slug!: string;
  public content!: string;
  public authorId!: number;
  public status!: 'draft' | 'published' | 'stored';
  public createdAt!: Date;
  public updatedAt!: Date;
  public publishedAt!: Date;
};

Post.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
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
  status: {
    type: DataTypes.ENUM('draft', 'published', 'stored'),
    defaultValue: 'draft',
    allowNull: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'Posts',
  timestamps: true,
})