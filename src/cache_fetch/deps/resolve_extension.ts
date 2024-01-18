import mime from 'mime-types';
import path from 'path';

const getMimeExtension = (value: string) => {
  const result = mime.extension(value);
  if (result) return `.${result}`;
  return undefined;
};

function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor = new (...args: any[]) => {};

function isInstanceof<T extends Constructor>(Type: T) {
  return (v: unknown): v is T => {
    return v instanceof Type;
  };
}

export function resolveExtension(...urlsOrContentTypes: (URL | string)[]) {
  const contentTypes = urlsOrContentTypes.filter(isString);
  const urls = urlsOrContentTypes.filter(isInstanceof(URL)).map(v => v.toString());
  const _urls = urls.map(url => path.extname(new URL(url).pathname));
  const _contentTypes = contentTypes.map(contentType => getMimeExtension(contentType));
  return [..._urls, ..._contentTypes]
    .filter(isDefined)
    .map(v => v.toLowerCase().trim())
    .map(v => v === '.jpeg' ? '.jpg' : v)
    .filter(v => v)[0];
}
