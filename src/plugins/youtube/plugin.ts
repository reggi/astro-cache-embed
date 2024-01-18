import type { Matcher, Plugin, Transformer } from "..";

const matcher: Matcher = (url: URL) => {
  return ['www.youtube.com', 'youtube.com', 'youtu.be', 'youtube.be', 'm.youtube.com',].includes(url.hostname);
};

const getYoutubeId = (value: string) => {
  const notWatch = (v: string) => v === 'watch' ? false : v;
  const a = value.match(/(?:https?:\/\/)?(?:www\.|m\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\/?\?v=|\/embed\/|\/shorts\/|\/)([^\s&?/#]+)/);
  if (a && a[1]) return notWatch(a[1]);
  const b = value.match(/^[a-zA-Z0-9_-]{11}$/);
  if (b) return notWatch(value);
  return false;
};

const getYoutubeUrls = (url: URL) => {
  const YOUTUBE_DOT_COM = 'https://youtube.com/';
  // parse url
  const parseUrl = new URL(url);
  const _start = parseUrl.searchParams.get('start');
  const _t = parseUrl.searchParams.get('t');
  const start = _start || _t;
  const code = getYoutubeId(url.toString());
  if (!code) throw new Error('Invalid YouTube URL');
  // embed url
  const embedURL = new URL(YOUTUBE_DOT_COM);
  embedURL.pathname = '/embed/' + code;
  embedURL.searchParams.set('autoplay', '1');
  if (start) embedURL.searchParams.set('start', start);
  const embed = embedURL.toString();
  // permalink url
  const permalinkURL = new URL(YOUTUBE_DOT_COM);
  permalinkURL.pathname = '/watch';
  permalinkURL.searchParams.set('v', code);
  if (start) permalinkURL.searchParams.set('t', start);
  const permalink = permalinkURL.toString();
  // oembed url
  const oembedURL = new URL(YOUTUBE_DOT_COM);
  oembedURL.pathname = `/oembed`;
  oembedURL.searchParams.set('url', permalink.toString());
  oembedURL.searchParams.set('format', 'json');
  const oembed = oembedURL.toString();
  // image
  const image = `https://img.youtube.com/vi/${code}/sddefault.jpg`;
  return { code, embed, image, oembed, permalink };
};

const YOUTUBE = 'YOUTUBE' as const;

export type YoutubeData = {
  data: {
    title?: string;
    code: string;
    embed: string;
    image: string;
    oembed: string;
    permalink: string;
  };
  type: typeof YOUTUBE;
};

export function guard(v: unknown): v is YoutubeData {
  return typeof v === 'object' && v !== null && 'type' in v && v.type === YOUTUBE;
}

const resolver = (data: ReturnType<typeof getYoutubeUrls>): Transformer => async ({ payload: res }) => {
  const custom: YoutubeData = {
    data: {
      ...data,
      title: res?.json.title
    },
    type: YOUTUBE,
  };
  return {
    ...res,
    custom,
    socialData: {
      ...res.socialData,
      domain: 'youtube.com',
      image: data.image,
      title: res?.json.title,
    },
  };
};

export const plugin: Plugin = async ({ url, fetcher }) => {
  const match = matcher(url);
  if (!match) return undefined;
  const youtubeUrls = getYoutubeUrls(url);
  const resolvedUrl = youtubeUrls.oembed;
  const transformer = resolver(youtubeUrls);
  const payload = await fetcher(resolvedUrl);
  return transformer({ fetcher, payload });
};
