import mime from 'mime-types'
import path from 'node:path';
import fs from 'node:fs/promises'
import { cacheLog } from "../log";
import { Op } from 'sequelize';
import { cache, type CacheOptions } from "./cache";
import { CacheFetch, type CacheFetchType } from "../models/fetch";
import { createHash } from 'node:crypto';

export function cacheHash (href: string) {
  return createHash('md5').update(href).digest('hex').substring(0, 16)
}

function includedContentType(contentType: string, mimes: string[]): boolean {
  let include = false;
  let exclude = false;

  mimes.forEach(mime => {
      if (mime.startsWith('^')) {
          if (contentType.startsWith(mime.substring(1))) {
              include = true;
          }
      } else if (mime.startsWith('!^')) {
          if (contentType.startsWith(mime.substring(2))) {
              exclude = true;
          }
      } else if (mime.startsWith('!')) {
          if (contentType === mime.substring(1)) {
              exclude = true;
          }
      } else {
          if (contentType === mime) {
              include = true;
          }
      }
  });

  return include && !exclude;
}

export type MakeFetchOptions = {
  downloadLocation?: string
  downloadMimes?: string[]
}

const retryHostnames = ['nitter.net']

const mimeExtension = (value: string) => {
  const result = mime.extension(value)
  if (result) return `.${result}`
  return undefined
}

/** this is a merge of the wepbage and image cache */
export async function makeFetch(href: string, options: MakeFetchOptions = {}): Promise<CacheFetchType> {
  const { downloadLocation, downloadMimes } = { downloadLocation: 'downloads', downloadMimes: [], ...options }
  cacheLog(href);
  const response = await fetch(href)
  const resolvedUrl = response.url
  const contentType = response.headers.get('content-type')
  const status = response.status

  if (status === 404 && retryHostnames.includes(new URL(resolvedUrl).hostname)) {
    cacheLog(`::retry:: ${resolvedUrl}`)
    return makeFetch(resolvedUrl, options)
  }

  const nativePathExt = path.extname(new URL(href).pathname)
  const resolvedPathExt = path.extname(new URL(resolvedUrl).pathname)
  const extension = resolvedPathExt || nativePathExt || contentType && mimeExtension(contentType) || undefined
  const common = { resolvedUrl, href, status, contentType, extension }
  
  if (contentType.startsWith('text/html')) {
    const html = await response.text()
    return { ...common, html };
  } 

  if (contentType.startsWith('application/json')) {
    const json = await response.json()
    return { ...common, json };
  }

  const shouldDownload = downloadMimes.length === 0 ? true : includedContentType(contentType, downloadMimes)
  if (!shouldDownload) return { ...common, src: href }

  const hash = cacheHash(href)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer);
  const filepath = path.join('public', downloadLocation, `${hash}${extension}`);
  cacheLog(`::writing:: ${filepath}`)
  await fs.writeFile(filepath, buffer);
  const src = "/" + path.join(downloadLocation, `${hash}${extension}`)
  return { ...common, hash, src, filepath }
}

export type CacheFetchOptions = MakeFetchOptions & CacheOptions

export const cacheFetch = async (href: string, options: CacheFetchOptions = {}) => {
  return cache(CacheFetch, {
    where: {
      [Op.or]: [
        { href: href },
        { resolvedUrl: href },
        { src: href },
        { filepath: href },
      ]
    },
    ...options,
  }, async () => {
    return makeFetch(href)
  })
}