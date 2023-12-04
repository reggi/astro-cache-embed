import { Op } from 'sequelize';
import { load, type CheerioAPI } from 'cheerio';
import type { MicroBlogProps } from "../types/micro_blog";
import { cacheLog } from "../log";
import { MastodonStatus } from "../models/mastodon_status";
import type { Status } from "../types/mastodon";
import { displayUrl, truncateString } from './cache_tweet';
import { cache, type CacheOptions } from './cache';
import { cacheFetch, type CacheFetchOptions } from './cache_fetch';

type MastodonStatusHtmlParserOpts = {
  truncateUrlLength?: number
}

class MastodonStatusHtmlParser {
  $: CheerioAPI
  truncateUrlLength: number
  constructor (html: string, opts?: MastodonStatusHtmlParserOpts) {
    this.$ = load(html)
    this.truncateUrlLength = opts?.truncateUrlLength || 25
  }
  init() {
    this.truncateUrls()
    this.paragraphPadding()
    return this.$.html()
  }
  truncateUrls () {
    const anchorElements = this.$('a'); // Select all anchor tags with 't.co' URLs
    for (let i = 0; i < anchorElements.length; i++) {
      const elem = anchorElements[i];
      const shortUrl = this.$(elem).attr('href');
      if (shortUrl) {
        const e = this.$(elem)
        const text = e.text()
        e.text(truncateString(displayUrl(text), this.truncateUrlLength));
      }
    }
  }
  paragraphPadding () {
    const anchorElements = this.$('p'); // Select all anchor tags with 't.co' URLs
    for (let i = 0; i < anchorElements.length; i++) {
      const elem = anchorElements[i];
      this.$(elem).addClass('mb-4')
    }
  }
  static init(html: string, opts?: MastodonStatusHtmlParserOpts) {
    return new MastodonStatusHtmlParser(html, opts).init()
  }
}


function parseToot (href: string) {
  const instance = new URL(href).hostname;
  const splitPathname = href.split("/");
  const id = splitPathname[splitPathname.length - 1]; 
  return { instance, id };
}

async function getMastodonStatusApi (resolvedUrl: string) {
  cacheLog(resolvedUrl)
  const res = await fetch(resolvedUrl);
  if (res.status !== 200) return null
  const body = await res.json()
  return body
}

export async function cacheMastodonStatusApi (href: string, options: CacheOptions = {}) {
  const { instance, id } = parseToot(href)
  const resolvedUrl = `https://${instance}/api/v1/statuses/${id}`
  return cache(MastodonStatus, {
    where: { [Op.or]: [{ href: resolvedUrl }, { href }]},
    ...options,
  }, async () => {
    const body = await getMastodonStatusApi(resolvedUrl)
    return {body, href, resolvedUrl}
  })
}

export function formatDate(dateString: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}, ${year}`;
}

export function getFullUsername (status: Status) {
  const url = new URL(status?.account?.url).hostname
  const username = status?.account?.acct
  return `@${username}@${url}`
}

export type MastodonStatusProps = MicroBlogProps & {
  favouritesCount: number,
  reblogsCount: number,
  repliesCount: number
}

export async function cacheMastodonStatus (href: string, options: CacheFetchOptions = {}): Promise<MastodonStatusProps | null> {
  const api = await cacheMastodonStatusApi(href, options)
  if (!api) return null
  const avatar = (await cacheFetch(api.body.account.avatar, options)).src
  if (!api.body.url) return null
  const audio = resolveAudioAttachments(api.body)[0]
  return {
    url: api.body.url,
    date: formatDate(api.body.created_at),
    displayName: api.body.account.display_name,
    html: MastodonStatusHtmlParser.init(api.body.content),
    profileImage: avatar,
    profileUrl: api.body.account.url,
    social: api.body.card ? {
      title: api.body.card.title,
      description: api.body.card.description,
      ogImage: api.body.card.image || undefined,
      href: api.body.card.url
    } : undefined,
    images: resolveImageAttachments(api.body),
    video: resolveVideoAttachments(api.body)[0],
    audio: audio ? {
      ...audio,
      poster: avatar,
    } : undefined,
    poll: api.body.poll,
    username: getFullUsername(api.body),
    favouritesCount: api.body.favourites_count,
    reblogsCount: api.body.reblogs_count,
    repliesCount: api.body.replies_count,
  }
}

function resolveImageAttachments (status: Status) {
  return status.media_attachments
    .filter(media => {
      return media.type == 'image'
    })
    .map(media => {
    return {
      id: media.id,
      src: media.url,
      alt: media.description,
      objectPosition: media.meta.focus && coordsToObjectPosition(transformCoordinates(media.meta.focus))
    }  
  })
}

function resolveAudioAttachments (status: Status) {
  return status.media_attachments
    .filter(media => {
      return media.type == 'audio'
    })
    .map(media => {
    return {
      src: media.url
    }  
  })
}

function resolveVideoAttachments (status: Status) {
  return status.media_attachments
    .filter(media => {
      return media.type == 'video'
    })
    .map(media => {
    return {
      id: media.id,
      src: media.url,
      alt: media.description,
      poster: media.preview_url,
    }  
  })
}

const decimalToPercent = (decimal: number): number => {
  return decimal * 100;
};

const percentOfNumber = (percent: number, number: number): number => {
  return (percent / 100) * number;
};

function transformCoordinates(o: {x: number, y: number}): { x: number, y: number } {
  const { x: inputX, y: inputY } = o
  let x = 50
  let y = 50
  const xDifference = percentOfNumber(decimalToPercent(inputX), x);
  const xOut = x + xDifference

  const yDifference = percentOfNumber(decimalToPercent(inputY), y);
  const yOut = y - yDifference
  return { x: xOut, y: yOut }
}

function coordsToObjectPosition (coords: {x: number, y: number}) {
  return `object-position: ${coords.x}% ${coords.y}%`
}

