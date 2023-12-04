import { type Props as MicroBlogProps } from "../types/micro_blog";
import { load, type CheerioAPI } from 'cheerio';
import { cacheTwitterEmbed } from "./cache_twitter_embed"
import { cacheWebpageSocialCard } from './cache_card'
import { cacheFetch, type CacheFetchOptions } from "./cache_fetch";
import type { CacheFetchType } from "../models/fetch";

export function displayUrl(url: string): string {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '');
}

export function removeQueryParameters(url: string, paramsToRemove: string[]): string {
  const urlObj = new URL(url);
  paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
  return urlObj.toString();
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  } else {
    return str;
  }
}

type DeTwitterHtmlOpts = {
  proxy?: string
  truncateUrlLength?: number
}

class DeTwitterHtml {
  $: CheerioAPI
  proxy: string
  truncateUrlLength: number
  constructor (
    html: string,
    public opts?: CacheTweetOptions
  ) {
    this.$ = load(html)
    this.proxy = opts?.proxy || 'twitter.com'
    this.truncateUrlLength = opts?.truncateUrlLength || 25
  }
  async expandShortUrls () {
    const anchorElements = this.$('a[href^="https://t.co/"]'); // Select all anchor tags with 't.co' URLs
    const urls: CacheFetchType[] = []
    for (let i = 0; i < anchorElements.length; i++) {
      const elem = anchorElements[i];
      const shortUrl = this.$(elem).attr('href');
      if (shortUrl) {
        const resolved = await cacheFetch(shortUrl, this.opts);
        const e = this.$(elem)
        e.attr('href', resolved.resolvedUrl); // Replace the href attribute with the final URL
        e.text(truncateString(displayUrl(resolved.resolvedUrl), this.truncateUrlLength));
        urls.push(resolved)
      }
    }
    return urls.filter(v => {
      const u = new URL(v.resolvedUrl)
      return !['twitter.com', 'x.com'].includes(u.hostname)
    })
  }
  replaceAnchorDomain(domains: string[], replacement: string) {
    const doc = this.$;
    doc('a').each(function() {
      const href = doc(this).attr('href');
      if (href) {
        const url = new URL(href);
        if (domains.includes(url.hostname)) {
          url.hostname = replacement;
          doc(this).attr('href', removeQueryParameters(url.href, ['ref_src']));
          const text = doc(this).text();
          if (text.includes(url.hostname)) {
            doc(this).text(text.replace(url.hostname, replacement));
          }
        }
      }
    })
  }
  get lastAnchor () {
    return this.$('blockquote').find('a').last()
  }
  date () {
    return this.lastAnchor.text();
  }
  removeLastAnchor () {
    return this.lastAnchor.remove()
  }
  removeUnwantedtext () {
    const blockquote = this.$('blockquote.twitter-tweet');
    // Iterate over child nodes of the blockquote
    blockquote.contents().each((_index, element) => {
      // Check if the node is a text node and not within a <p> tag
      if (element.type === 'text' && element?.parent && element?.parent['name'] !== 'p') {
        this.$(element).remove(); // Remove the text node
      }
    })
  }
  // unencapsulateBlockquotes(){
  //   this.$('blockquote').each((_, blockquote) => {
  //     const content = this.$(blockquote).html();
  //     this.$(blockquote).replaceWith(content);
  //   })
  // }
  async init () {
    const urls = await this.expandShortUrls()
    this.replaceAnchorDomain(['twitter.com', 'x.com'], this.proxy)
    const date = this.date()
    this.removeLastAnchor()
    this.removeUnwantedtext()
    // this.unencapsulateBlockquotes()
    const socialUrl = urls[urls.length -1]
    return { html: this.$.html(), date, urls, socialUrl, proxy: this.proxy }
  }
  static init (html: string, opts?: CacheTweetOptions) {
    return new DeTwitterHtml(html, opts).init()
  }
}

export const getProfileImage = async (username: string, options: CacheFetchOptions = {}) => {
  if (!username || typeof username !== 'string') return null
  try {
    const entry = await cacheFetch(`https://nitter.net/${username}`, options);
    const $ = load(entry.html || '');
    const base = $('.profile-card-avatar img').attr('src');
    if (!base) return null
    return `https://nitter.net${base}`
  } catch (error) {
    console.error('Error fetching or parsing:', error);
    return null;
  }
};

export function usernameFromProfileUrl (url: string) {
  const username = new URL(url)
  const un = username.pathname.replace('/', '')
  return un
}

export const cleanTwitterEmbed = async (href: string, opts?: CacheTweetOptions) => {
  const content = await cacheTwitterEmbed(href, opts)
  const username = usernameFromProfileUrl(content?.author_url)
  const parsedHtml = await DeTwitterHtml.init(content.html, opts)
  const atUsername = `@${username}`
  return { ...content, ...parsedHtml, username, atUsername }
}

const replaceTwitterWithProxy = (href: string, proxy?: string) => {
  return proxy ? href.replace('twitter.com', proxy) : href
}

export type CacheTweetOptions = CacheFetchOptions & DeTwitterHtmlOpts

export const cacheTweet = async (href: string, options: CacheTweetOptions = {}): Promise<MicroBlogProps> => {
  const embed = await cleanTwitterEmbed(href, options)
  const ogProfileImage = await getProfileImage(embed.username, options)
  const profileImage = ogProfileImage ? (await cacheFetch(ogProfileImage, options)) : undefined
  const social = cacheWebpageSocialCard(embed.socialUrl)
  return {
    date: embed.date,
    displayName: embed.author_name,
    html: embed.html,
    profileImage: profileImage?.src,
    profileUrl: replaceTwitterWithProxy(embed.author_url, embed.proxy),
    social,
    url: replaceTwitterWithProxy(href, embed.proxy),
    username: embed.atUsername
  }
}
