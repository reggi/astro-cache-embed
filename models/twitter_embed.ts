import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';

export const modelName = 'TwitterEmbed'

export type TwitterEmbedType = InferAttributes<TwitterEmbed>

export class TwitterEmbed extends Model<InferAttributes<TwitterEmbed>, InferCreationAttributes<TwitterEmbed>> {
  declare id: number; // Primary key
  declare href: string;
  declare url: string;
  declare author_name: string;
  declare author_url: string;
  declare html: string;
  declare width: number;
  declare height: number | null;
  declare type: string;
  declare cache_age: string;
  declare provider_name: string;
  declare provider_url: string;
  declare version: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const attributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  href: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  html: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true // Allowing null as per the Zod schema
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cache_age: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provider_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provider_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}

export default { model: TwitterEmbed, attributes, modelName }