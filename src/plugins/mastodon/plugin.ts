import { type FetcherOption, type Plugin, type URLObjectOption } from "../../plugins";
import { transformData, type MastodonMicroBlogProps } from "./transform_data";
import { transformHtml } from "./transform_html";

function parseMastodonStatusUrl(url: URL) {
  const instance = url.hostname;
  const splitPathname = url.pathname.split("/");
  const id = splitPathname[splitPathname.length - 1];
  return { id, instance };
}

function getMastodonApiStatusUrl(url: URL) {
  const { id, instance } = parseMastodonStatusUrl(url);
  return `https://${instance}/api/v1/statuses/${id}`;
}

function getMastodonApiInstanceUrl(url: URL) {
  return `https://${url.hostname}/api/v2/instance`;
}

export const checkDomain = async (props: FetcherOption & URLObjectOption) => {
  const { fetcher, url } = props;
  const apiStatusUrl = getMastodonApiInstanceUrl(url);
  try {
    const instanceApi = await fetcher(apiStatusUrl);
    if (instanceApi.status !== 200) return undefined;
    if (!instanceApi.json) return undefined;
    const valid = [
      instanceApi?.json?.domain,
      instanceApi?.json?.title,
      instanceApi?.json?.version,
    ].every(value => typeof value !== 'undefined');
    if (!valid) return undefined;
    return instanceApi;
  } catch {
    return undefined;
  }
};

export const getMastodonStatusData = async (props: FetcherOption & URLObjectOption) => {
  const { fetcher, url } = props;
  const apiStatusUrl = getMastodonApiStatusUrl(url);
  try {
    const statusApi = await fetcher(apiStatusUrl);
    if (statusApi.status !== 200) return undefined;
    if (!statusApi.json) return undefined;
    const valid = [
      statusApi?.json?.id,
      statusApi?.json?.created_at,
      statusApi?.json?.account?.id,
      statusApi?.json?.account?.username,
      statusApi?.json?.account?.acct,
    ].every(value => typeof value !== 'undefined');
    if (!valid) return undefined;
    return statusApi;
  } catch {
    return undefined;
  }
};

const validateMastodonStatusUrl = (url: URL) => {
  const paths = url.pathname.split("/").filter(Boolean);
  const validPathLength = (paths.length === 2);
  if (!validPathLength) return false;
  if (!paths[0].startsWith("@")) return false;
  return true;
};

const MASTODON = 'MASTODON' as const;

type MastodonData = {
  data: MastodonMicroBlogProps;
  type: typeof MASTODON;
};

export function guard(v: unknown): v is MastodonData {
  return typeof v === 'object' && v !== null && 'type' in v && v.type === MASTODON;
}

export const plugin: Plugin = async (props) => {
  const { fetcher, url } = props;
  if (!validateMastodonStatusUrl(url)) return undefined;
  const results = await checkDomain({ fetcher, url });
  if (!results) return undefined;
  const statusApi = await getMastodonStatusData({ fetcher, url });
  if (!statusApi) return undefined;
  const custom: MastodonData = {
    data: await transformData({
      fetcher,
      status: statusApi.json,
      transformHtml: (html) => transformHtml({ html })
    }),
    type: MASTODON,
  };
  return {
    ...statusApi,
    custom
  };
};
