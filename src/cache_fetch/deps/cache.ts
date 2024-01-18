import {
  type Attributes,
  type CreationOptional,
  DataTypes,
  Model,
  type ModelStatic,
  Op,
  Sequelize,
  type WhereOptions,
  type CreationAttributes,
  type InferAttributes,
  type InferCreationAttributes
} from 'sequelize';

export const modelName = 'CacheFetch';

export class CacheFetch extends Model<InferAttributes<CacheFetch>, InferCreationAttributes<CacheFetch>> {
  declare contentType: string;
  declare extension?: string;
  declare filepath?: string;
  declare hash?: string;
  declare href: string;
  declare html?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare json?: any;
  declare resolvedUrl: string;
  declare src?: string;
  declare status: number;

  declare id: CreationOptional<number>;  // Added id declaration
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export type CacheFetchType = CreationAttributes<CacheFetch>;

const nullable = (type: DataTypes.DataType) => ({ allowNull: true, type, });

export const CacheFetchInitSequalize = (sequelize: Sequelize) => {
  CacheFetch.init({
    contentType: {
      type: DataTypes.STRING
    },
    createdAt: DataTypes.DATE,
    extension: nullable(DataTypes.STRING),
    filepath: nullable(DataTypes.STRING),
    hash: nullable(DataTypes.STRING),
    href: nullable(DataTypes.STRING),
    html: nullable(DataTypes.TEXT),
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    json: nullable(DataTypes.JSON),
    resolvedUrl: {
      type: DataTypes.STRING
    },
    src: nullable(DataTypes.STRING),
    status: nullable(DataTypes.INTEGER),
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    tableName: modelName,
  });
};

type PreventOption = { prevent?: boolean; };
type ClearOption = { clear?: boolean; };
export type CacheOptions = ClearOption & PreventOption;
type WhereOption<M extends Model> = { where: WhereOptions<Attributes<M>>; };
type WhereHandler<M extends Model> = (where: WhereOptions<Attributes<M>>) => Promise<CreationAttributes<M>>;
type WhereHandlerOption<M extends Model> = { whereHandler: WhereHandler<M>; };

type ModelOption<M extends Model> = { model: ModelStatic<M>; };

export async function cache<M extends Model>(props: CacheOptions & ModelOption<M> & WhereHandlerOption<M> & WhereOption<M>): Promise<CreationAttributes<M>> {
  const { model, where, prevent, whereHandler: handler } = props;
  const clear = props.clear;
  if (prevent) return handler(where);
  const entry = await model.findOne({ where });
  // if (entry && 'status' in entry && ![200].includes(entry.status as number)) {
  //   console.log({ entry });
  // }
  if (entry) {
    if (!clear) return entry.get();
  }
  const body = await handler(where);
  if (entry && clear) {
    const updated = await entry.update(body);
    return updated.get();
  }
  const created = await model.create(body, { returning: true });
  return created.get();
}

export type UrlHandler = (url: string) => Promise<CreationAttributes<CacheFetch>>;
type UrlOption = { url: string; };
type UrlHandlerOption = { urlHandler: UrlHandler; };

export function cacheFetchHandler(props: CacheOptions & UrlHandlerOption & UrlOption) {
  const { urlHandler, url, ...options } = props;
  const whereHandler = () => urlHandler(url);
  const where = {
    [Op.or]: [
      { href: url },
      { resolvedUrl: url },
      { src: url },
      { filepath: url }
    ]
  };
  const model = CacheFetch;
  return cache({ whereHandler, ...options, model, where });
}

export const initializeSequalize = async (sqlFile?: string) => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
    storage: sqlFile || './cache.sqlite',
  });
  CacheFetchInitSequalize(sequelize);
  // await sequelize.sync({ force: true }); // drops tables
  // await sequelize.sync({ alter: true }); // updates tables
  await sequelize.sync();
};

// type CacheFetchCreate = CreationAttributes<CacheFetch>;
