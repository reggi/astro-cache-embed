import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type CreationAttributes } from 'sequelize';

export const modelName = 'CacheFetch';

export class CacheFetch extends Model<InferAttributes<CacheFetch>, InferCreationAttributes<CacheFetch>> {
  declare contentType: string;
  declare extension?: string;
  declare filepath?: string;
  declare hash?: string;
  declare href: string;
  declare html?: string;
  declare json?: any;
  declare resolvedUrl: string;
  declare src?: string;
  declare status: number

  declare id: CreationOptional<number>;  // Added id declaration
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export type CacheFetchType = CreationAttributes<CacheFetch>

export const attributes = {
  contentType: { type: DataTypes.STRING, allowNull: false },
  extension: { type: DataTypes.STRING, allowNull: true },
  filepath: { type: DataTypes.STRING, allowNull: true },
  hash: { type: DataTypes.STRING, allowNull: true},
  href: { type: DataTypes.STRING, allowNull: false },
  html: { type: DataTypes.TEXT, allowNull: true  },
  json: { type: DataTypes.JSON, allowNull: true  },
  resolvedUrl: { type: DataTypes.STRING, allowNull: false },
  src: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: true},
}

export default { model: CacheFetch, attributes, modelName }
