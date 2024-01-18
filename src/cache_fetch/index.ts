import mime from 'mime-types';
import { cacheFetchHandler, type CacheFetchType, type CacheOptions, type UrlHandler } from './deps/cache.ts';
import { compositeResponse, isAudio, isImage, isVideo } from './deps/content_type.ts';
import { downloader as customDownloader } from './deps/downloader.ts';
import { fetchRetry, type FetchSignature } from './deps/fetch_retry.ts';
import { hasher } from './deps/hasher.ts';
import { logger } from './deps/logger.ts';
import { resolveExtension } from './deps/resolve_extension.ts';
import { handleResponse, type Downloader } from './deps/response_handler.ts';
import { takeScreenshot } from './deps/screenshot.ts';
import { shouldRetryFetch, type RetryOption, type RetryOptions } from './deps/should_retry_fetch.ts';
import { SIZELARGE, parse as socialDataParse, type SocialData } from './deps/social_data.ts';
import { safeURL } from './deps/safe_url.ts';

export type CacheFetchOptionsCore = {
  retryHostnames?: RetryOptions,
  retryDefaults?: RetryOption,
  downloadLocation: string,
  fetcher?: FetchSignature | undefined;
};

export type SocialDataOption = { socialData?: Partial<SocialData> }
export type CustomOption = { custom?: { type: string, data?: any; }}
export type Payload = CacheFetchType & CustomOption & SocialDataOption
export type URLOption = { url: URL | string; };
export type ScreenshotOption = { screenshot?: boolean }
export type CacheFetchOptions = CacheFetchOptionsCore & CacheOptions & ScreenshotOption & URLOption;

function falsePayload (inputUrl: string): Payload {
  const res = {
    contentType: mime.lookup(inputUrl) || '',
    href: inputUrl,
    resolvedUrl: inputUrl,
    src: inputUrl,
    status: 200,
  };
  return res;
}

const shouldDownload = compositeResponse(isAudio, isVideo, isImage);

export async function cacheFetch(props: CacheFetchOptions) {
  const { clear, prevent, url, screenshot: shouldScreenshot, fetcher } = props;
  const options = { clear, prevent };
  const urlHandler: UrlHandler = async inputUrl => {
    if (!safeURL(inputUrl)) return falsePayload(inputUrl);
    const { downloadLocation, retryHostnames, retryDefaults } = props;
    const downloadDeps = { downloadLocation, hasher, logger };
    const shouldRetry = shouldRetryFetch(retryHostnames, retryDefaults);
    const response = await fetchRetry({ fetcher, logger, shouldRetry, url: inputUrl });
    const downloader: Downloader = (response) => customDownloader({ ...downloadDeps, resolveExtension, response });
    const content = await handleResponse({ downloader, response, shouldDownload });
    const { url: resolvedUrl, ...result } = content;
    const screenshotData = { ...(shouldScreenshot && result.html) ? await takeScreenshot({ ...downloadDeps, url: resolvedUrl }) : {} };
    return { href: inputUrl, resolvedUrl, ...result, ...screenshotData };
  };
  const stringUrl = (typeof url === 'string') ? url : url.toString();
  const result = await cacheFetchHandler({ urlHandler, ...options, url: stringUrl });
  const socialData = { ...(result.html) ? socialDataParse(result.html, result.resolvedUrl) : {} };
  if (shouldScreenshot) {
    socialData.image = result.src;
    socialData.size = SIZELARGE;
  }
  const main: Payload = { socialData, ...result };
  return main;
}