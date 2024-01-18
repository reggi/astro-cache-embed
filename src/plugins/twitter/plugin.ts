import { load } from 'cheerio';
import path from 'node:path';

import type { FetcherOption, Plugin, Transformer, URLObjectOption } from '../../plugins/index.ts';
import { parse as parseEmbedHtml, type ProxyUrlOption } from './parse_html.ts';
import { SIZESMALL } from '../../cache_fetch/deps/social_data.ts';
import type { MicroBlogProps } from '../../components/MicroBlog.astro';

type TweetData = { username: string, id: string; };
type ProxyHostsOption = { proxyHosts?: string[]; };

const parseTwitterUrl = (props: ProxyHostsOption & URLObjectOption): TweetData | undefined => {
  const { url, proxyHosts } = props;
  const hostMatch = ['x.com', 'twitter.com', 'nitter.net', ...proxyHosts || []].includes(url.hostname);
  const splitPath = url.pathname.split(path.sep).filter(Boolean);

  const username = splitPath[0];
  const pathMatch = splitPath[1] === 'status';
  const id = splitPath[2];
  const idMatch = typeof id !== 'undefined';
  if (hostMatch && pathMatch && idMatch) return { id, username };
  return undefined;
};

export const getEmbedUrl = (href: string) => {
  const oembedUrl = new URL('https://publish.twitter.com/oembed');
  oembedUrl.searchParams.set('url', href);
  return oembedUrl.toString();
};

const getTweetUrl = (data: TweetData) => `https://twitter.com/${data.username}/status/${data.id}`;
const getNitterProfileUrl = (data: Omit<TweetData, 'id'>) => `https://nitter.net/${data.username}`;

const getProfileImageFromNitter = async (props: FetcherOption & Omit<TweetData, 'id'>) => {
  const { username, fetcher } = props;
  if (!username || typeof username !== 'string') return undefined;
  try {
    const entry = await fetcher(getNitterProfileUrl({ username }));
    const $ = load(entry.html || '');
    const base = $('.profile-card-avatar img').attr('src');
    if (!base) return undefined;
    return `https://nitter.net${base}`;
  } catch (error) {
    console.error('Error fetching or parsing:', error);
    return undefined;
  }
};

export type TwitterData = {
  data: MicroBlogProps,
  type: typeof TWITTER;
};

const TWITTER = 'TWITTER' as const;

export function guard(v: unknown): v is TwitterData {
  return typeof v === 'object' && v !== null && 'type' in v && v.type === TWITTER;
}

const resolver = (props: ProxyUrlOption & TweetData) => {
  const { id, username, proxyUrl } = props;
  const tweetUrl = getTweetUrl({ id, username });
  const embedUrl = getEmbedUrl(tweetUrl);
  const resolver: Transformer = async ({ payload: res, fetcher }) => {
    const profileImage = await getProfileImageFromNitter({ fetcher, username });
    const data = await parseEmbedHtml({ fetcher, html: res.json.html, proxyUrl });
    const replaceWithProxyUrl = (url: string) => {
      if (!proxyUrl) return url;
      const u = new URL(url);
      u.hostname = proxyUrl;
      return u.toString();
    };
    if (!data.html) throw new Error('No html');
    const custom: TwitterData = {
      data: {
        date: data.date,
        displayName: res.json.author_name,
        html: data.html,
        profileImage,
        profileUrl: replaceWithProxyUrl(res.json.author_url),
        social: data.social ? {
          url: data.social.resolvedUrl,
          ...data.social.socialData
        } : undefined,
        url: replaceWithProxyUrl(tweetUrl),
        username: `@${username}`,
      },
      type: TWITTER,
    };
    return {
      ...res,
      custom,
      socialData: {
        ...(res.socialData || {}),
        domain: 'twitter.com',
        image: profileImage,
        size: SIZESMALL,
        title: res?.json?.title,
      }
    };
  };
  return { transformer: resolver, url: embedUrl };
};

export const pluginEdit = (props: ProxyHostsOption & ProxyUrlOption = {}): Plugin => async (opts) => {
  const { url, fetcher } = opts;
  const { proxyHosts, proxyUrl } = props;
  const data = parseTwitterUrl({ proxyHosts, url });
  if (!data) return undefined;
  const { transformer, url: newUrl } = resolver({ ...data, proxyUrl });
  const payload = await fetcher(newUrl);
  return transformer({ fetcher, payload });
};

export const plugin = pluginEdit();
