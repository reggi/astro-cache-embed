import type { Matcher, Plugin } from "..";

const TIKTOK = "TIKTOK" as const;

type TikTokOEmbed = {
  version: string;
  type: string;
  title: string;
  author_url: string;
  author_name: string;
  width: string;
  height: string;
  html: string;
  thumbnail_width: number;
  thumbnail_height: number;
  thumbnail_url: string;
  provider_url: string;
  provider_name: string;
};

type TikTokData = {
  data: TikTokOEmbed;
  type: typeof TIKTOK;
};

const guard = (v: unknown): v is TikTokData => {
  return typeof v === "object" && v !== null && "type" in v && v.type === TIKTOK;
};

const matcher: Matcher = (url: URL) => {
  const split = url.pathname.split('/').filter(Boolean);
  return url.hostname === 'www.tiktok.com'
    && split.length === 3
    && split[1] === 'video';
};

const plugin: Plugin = async (props) => {
  const { url, fetcher } = props;
  if (!matcher(url)) return undefined;
  const payload = await fetcher(`https://www.tiktok.com/oembed?url=${url}`);
  const custom: TikTokData = {
    data: payload.json,
    type: TIKTOK
  };
  return { custom, ...payload };
};

export const tiktok = { guard, plugin };