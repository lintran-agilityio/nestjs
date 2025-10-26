import bcrypt from "bcrypt";
import { DataTypes, Model } from "sequelize";

import { sequelize } from "../configs/database";

interface UserAttributes {
  userId: number;
  email: string;
  password: string;
  username: string;
  isAdmin: boolean;
};

interface UserCreationAttributes {
  email: string;
  password: string;
  username: string;
  isAdmin?: boolean;
};

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: number;
  public email!: string;
  public password!: string;
  public username!: string;
  public isAdmin!: boolean;

  async isValidPassword(password: string): Promise<boolean> {
      return await bcrypt.compare(password, this.password);
  }
};

User.init({
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
    validate: {
      isAlphanumeric: true,
    }
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
});
