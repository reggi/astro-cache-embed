import { cacheFetch, type CacheFetchOptions } from "./cache_fetch"

export const getYoutubeId = (value: string) => {
  const notWatch = (v: string) => v === 'watch' ? false : v
  const a = value.match(/(?:https?:\/\/)?(?:www\.|m\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\/?\?v=|\/embed\/|\/)([^\s&?/#]+)/)
  if (a && a[1]) return notWatch(a[1])
  const b = value.match(/^[a-zA-Z0-9_-]{11}$/)
  if (b) return notWatch(value)
  return false
}

type YoutubeOptions = {
  title?: string
}

export type CacheYoutubeOptions = CacheFetchOptions & YoutubeOptions

export const cacheYoutube = async (href: string, options: CacheYoutubeOptions = {}) => {
  const { title } = options
  const url = new URL(href)
  const urlTitle = url.searchParams.get('title')
  const start = url.searchParams.get('start')
  const rawTitle = urlTitle || title || ''
  const code = getYoutubeId(href)
  if (!code) throw new Error('Invalid YouTube URL')
  const embed = new URL('https://www.youtube.com')
  embed.pathname = '/embed/' + code
  embed.searchParams.set('autoplay', '1')
  if (start) embed.searchParams.set('start', start)
  const imageSrc = `https://img.youtube.com/vi/${code}/sddefault.jpg`
  const image = await cacheFetch(imageSrc, options)
  return { image: image?.src, code, embed: embed.toString(), title: rawTitle }
}