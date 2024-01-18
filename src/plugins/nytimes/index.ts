import type { Matcher, Resolver, Transformer } from "../index.ts";
import { compositePlugin } from "../index.ts";

const matcher: Matcher = (url: URL) => {
  return ['www.nytimes.com', 'nytimes.com'].includes(url.hostname);
};

const resolver: Resolver = (url) => {
  const result = new URL('https://www.nytimes.com/svc/oembed/json/');
  result.searchParams.set('url', url.toString());
  const value = result.toString();
  return value;
};

const NYTIMES = 'NYTIMES' as const;

type NytimesData = {
  type: typeof NYTIMES;
};

export function guard(v: unknown): v is NytimesData {
  return typeof v === 'object' && v !== null && 'type' in v && v.type === NYTIMES;
}

const handler: Transformer = async (options) => {
  const { payload: res } = options;
  if (!res || !res.json) throw new Error('Invalid nytimes URL');
  const custom: NytimesData = {
    type: NYTIMES,
  };
  return {
    ...res,
    custom,
    socialData: {
      ...res['socialData'],
      description: res.json.summary,
      domain: 'nytimes.com',
      image: res.json.thumbnail_url,
      size: 'large',
      title: res.json.title,
    }
  };
};

export const plugin = compositePlugin({ handler, matcher, resolver });
