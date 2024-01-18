import { resolveURL, type InputURL, withoutInputUrl } from './astro.ts';
import type { CacheOptions } from './cache_fetch/deps/cache.ts';
import { cacheFetch, type ScreenshotOption, type CacheFetchOptionsCore } from './cache_fetch/index.ts';
import { compositePlugins } from './plugins/index.ts';
import { resolvePlugins, type Plugin } from './plugins/index.ts';

export type PluginModule = {
  plugin: Plugin;
  guard?: (props: any) => boolean;
  Component?: any
  custom?: (props: any) => PluginModule
}
export type PluginModules= {[key: string]: PluginModule}
export type PluginModulesOption = { plugins: PluginModules; };
type AstroComponent = (_props: any) => any
export type FetcherOptions = CacheOptions & InputURL & ScreenshotOption

export const fetcher = async (options: CacheFetchOptionsCore & FetcherOptions & PluginModulesOption) => {
  const url = resolveURL(options);
  // console.log({ options });
  const fetcher = (url: URL | string) => cacheFetch({ ...withoutInputUrl(options), url});
  const payload = await compositePlugins({ fetcher, plugins: resolvePlugins(options.plugins), url });
  const MatchPlugin = Object.entries(options.plugins).find(([_key, plugin]) => plugin && "guard" in plugin && plugin.guard && plugin?.guard(payload.custom));
  const Component = (MatchPlugin && MatchPlugin[1] && 'Component' in MatchPlugin[1] && MatchPlugin[1].Component) || undefined as AstroComponent | undefined;
  return { Component, payload };
};
