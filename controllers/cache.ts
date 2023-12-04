import type { Model, ModelStatic, WhereOptions, Attributes, CreationAttributes } from 'sequelize';

export type CacheOptions = {
  dontCache?: boolean;
  clearCache?: boolean;
}

export async function cache<M extends Model, W extends WhereOptions<Attributes<M>>>(
  model: ModelStatic<M>, 
  options: CacheOptions & {
    where: W;
  },
  handler: (where: W) => Promise<CreationAttributes<M>>
): Promise<undefined | CreationAttributes<M>> {
  if (options.dontCache) return handler(options.where)
  const entry = await model.findOne({ where: options.where });
  if (entry) {
    if (!options.clearCache) return entry.get();
  }
  const body = await handler(options.where);
  if (entry && options.clearCache) {
    const updated = await entry.update(body);
    return updated.get();
  }
  const created = await model.create(body, { returning: true });
  return created.get();
}