import mime from 'mime-types'
import path from 'node:path'
import { cacheMastodonStatusApi } from './cache_mastodon_status';
import { cacheFetch, type CacheFetchOptions } from './cache_fetch';

export const YOUTUBE = 'youtube'
export const TWEET = 'tweet'
export const MASTODON = 'mastodon'
export const IMAGE = 'image'
export const AUDIO = 'audio'
export const CARD = 'card'
export const VIDEO = 'video'
export const GIST = 'gist'

const convertTypeToProp = (type: string) => {
  return {
    useYoutube: type === YOUTUBE,
    useTweet: type === TWEET,
    useMastodon: type === MASTODON,
    useImage: type === IMAGE,
    useAudio: type === AUDIO,
    useCard: type === CARD,
    useVideo: type === VIDEO,
    useGist: type === GIST
  }
}

const extBased = (ext: string) => {
  const lookup = mime.lookup(ext)
  if (!lookup)  return undefined
  return contentTypeBased(lookup)
}

const contentTypeBased = (contentType: string) => {
  if (!contentType) return undefined
  if (contentType.startsWith('image')) return IMAGE
  if (contentType.startsWith('audio')) return AUDIO
  if (contentType.startsWith('video')) return VIDEO
  return undefined
}

/** need to choose what component to render */
export const _cacheEmbed = async (href: string, options: CacheFetchOptions = {}): Promise<string> => {
  if (!href) return ''
  if (!href.startsWith('http')) {
    const ext = path.extname(href)
    return extBased(ext)
  }
  const url = new URL(href)
  const hostname = url.hostname
  const pathname = url.pathname
  const ext = path.extname(pathname)
  const i = extBased(ext)
  if (i) return i
  if (['www.youtube.com', 'youtube.com'].includes(hostname)) {
    return YOUTUBE
  }
  if (['twitter.com', 'nitter.net', 'x.com'].includes(hostname)) {
    return TWEET
  }
  if (['gist.github.com'].includes(hostname)) {
    return GIST
  }
  const checkMastodon = await cacheMastodonStatusApi(href, options)
  if (checkMastodon.body) {  
    return MASTODON
  }
  const cache = await cacheFetch(href, options)
  const match = contentTypeBased(cache.contentType)
  if (match) return match
  return CARD
}

export const cacheEmbed = async (href: string, options: CacheFetchOptions = {}) => {
  return convertTypeToProp(await _cacheEmbed(href, options))
}