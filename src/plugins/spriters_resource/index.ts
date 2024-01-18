
import type { Matcher, Plugin } from "../index";
import { SIZELARGE } from "../../cache_fetch/deps/social_data";

const matcher: Matcher = (url: URL) => {
  return url.hostname === 'www.spriters-resource.com' && url.pathname.split('/').filter(Boolean).length === 4;
};

export const plugin: Plugin = async (props) => {
  const { url, fetcher } = props;
  const isMatch = matcher(url);
  if (!isMatch) return undefined;
  const payload = await fetcher(url);
  const $ = payload?.socialData?.$;
  if (!$) return payload;
  const image = $('#sheet-container img').attr('src');
  if (!image) return payload;
  return {
    ...payload,
    socialData: {
      ...payload.socialData,
      image: `https://www.spriters-resource.com${image}`,
      size: SIZELARGE
    }
  };
};

