import { cacheFetch, type CacheFetchOptions } from "./cache_fetch";

export async function cacheGist (href: string, options: CacheFetchOptions = {}) {
  const data = await cacheFetch(`${href}.json`, options)
  return {
    stylesheet: data.json.stylesheet,
    html: data.json.div
  }
}