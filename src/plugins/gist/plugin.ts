import type { Matcher, Plugin } from "../../plugins";

const matcher: Matcher = (url: URL) => {
  return url.hostname === 'gist.github.com' && url.pathname.split('/').filter(Boolean).length === 2;
};

const GIST = "GIST" as const;

export type GistData = {
  data: {
    stylesheet: string;
    html: string;
  };
  type: typeof GIST;
};

const guard = (v: unknown): v is GistData => {
  return typeof v === "object" && v !== null && "type" in v && v.type === GIST;
};

const plugin: Plugin = async (props) => {
  const { url, fetcher } = props;
  if (!matcher(url)) return undefined;
  const payload = await fetcher(`${url}.json`);
  const html = payload?.json?.div;
  const stylesheet = payload?.json?.stylesheet;
  if (!html || !stylesheet) return undefined;
  const custom: GistData = {
    data: { html, stylesheet },
    type: GIST
  };
  return { custom, ...payload };
};

export { guard, plugin };