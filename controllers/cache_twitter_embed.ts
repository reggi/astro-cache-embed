import { TwitterEmbed } from '../models/twitter_embed';
import { cacheLog } from '../log';
import { cache, type CacheOptions } from './cache';

export const getEmbedUrl = (href: string) => {
  const oembedUrl = new URL('https://publish.twitter.com/oembed');
  oembedUrl.searchParams.set('url', href);
  oembedUrl.searchParams.set('omit_script', 'true');
  oembedUrl.searchParams.set('dnt', 'true');
  return oembedUrl.toString()
}

export const fetchTwitterEmbed = async (href: string) => {
  cacheLog(href)
  const oembed = getEmbedUrl(href)
  const request = await fetch(oembed);
  const response = await request.json();
  return {...response, href}
}

export const cacheTwitterEmbed = async (href: string, options: CacheOptions = {}) => {
  return cache(TwitterEmbed, {
    where: { href },
    ...options
  }, async ({ href }) => {
    return fetchTwitterEmbed(href)
  })
}
