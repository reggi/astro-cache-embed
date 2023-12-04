import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import type { Status } from '../types/mastodon';

export const modelName = 'MastodonStatus';

export type MastodonStatusType = InferAttributes<MastodonStatus>;

export class MastodonStatus extends Model<InferAttributes<MastodonStatus>, InferCreationAttributes<MastodonStatus>> {
  declare href: string;
  declare body: Status;
  declare resolvedUrl: string;
}

export const attributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  href: DataTypes.STRING,
  resolvedUrl: DataTypes.STRING,
  body: { type: DataTypes.JSON, allowNull: true }
};

export default { model: MastodonStatus, attributes, modelName };
