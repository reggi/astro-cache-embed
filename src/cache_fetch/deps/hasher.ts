import { createHash } from 'node:crypto';

export type Hasher = (input: string) => string;
export type HasherOption = { hasher: Hasher; };

export const hasher: Hasher = (string: string) => {
  return createHash('md5').update(string).digest('hex').substring(0, 16);
};

