
import type { Payload, URLOption } from "../cache_fetch";
import type { LoggerOption } from "../cache_fetch/deps/logger";

/** sync matches a domain for interception */
export type Matcher = (url: URL) => boolean;
/** resolves a domain to another url useful for oembed conversion */
export type Resolver = (url: URL) => string;
/** the operation itself provided by the plugin harness */
export type Fetcher = (url: URL | string) => Promise<Payload>;
/** transforms the payload, and provides access to the fetcher */
export type Transformer = (options: { payload: Payload, fetcher: Fetcher; }) => Promise<Payload>;
/** interceptor-type plugin arguments */
export type InterceptorArgs = { matcher: Matcher; resolver: Resolver; handler: Transformer; };

export type FetcherOption = { fetcher: Fetcher; };
export type URLObjectOption = { url: URL; };
export type PluginsArgs = FetcherOption & URLObjectOption;
export type Plugin = (props: PluginsArgs) => Promise<Payload | undefined>;
export type PluginsOption = { plugins: Plugin[]; };

export const defaultPlugin = async (props: FetcherOption & { url: string }) => {
  const { fetcher, url } = props;
  const result = await fetcher(url);
  return result;
};

export function compositePlugin(props: InterceptorArgs & Partial<LoggerOption>): Plugin {
  const { logger = () => { } } = props;
  return async (options) => {
    const { url, fetcher } = options;
    const match = props.matcher(url);
    if (!match) return undefined;
    logger('matcher found', {});
    const resolvedUrl = props.resolver(url);
    logger('resolved url', { from: url, to: resolvedUrl });
    const payload = await fetcher(new URL(resolvedUrl));
    return props.handler({ fetcher, payload });
  };
}

export async function compositePlugins(props: FetcherOption & PluginsOption & URLOption) {
  const { fetcher, plugins, url } = props;
  if (typeof url === 'string' && url.startsWith('/')) return defaultPlugin({ fetcher, url });
  const objectUrl = (typeof url === 'string') ? new URL(url) : url;
  for (const plugin of plugins) {
    const result = await plugin({ fetcher, url: objectUrl });
    if (result) return result;
  }
  return defaultPlugin({ fetcher, url: objectUrl.toString() });
}

export const resolvePlugins = (plugins: { [key: string]: { plugin: Plugin } }) => {
  return Object.entries(plugins).map(([_key, { plugin }]) => plugin);
};