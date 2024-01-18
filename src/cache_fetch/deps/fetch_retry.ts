import type { LoggerOption } from "./logger.ts";

export type PlainRequest = { status: number; url: string; };
export type ShouldRetry = (response?: PlainRequest, retryCount?: number) => boolean;
export type ShouldRetryOption = { shouldRetry: ShouldRetry; };
export type FetchSignature = (url: Request | URL | string) => Promise<Response>;
export type FetchOption = { fetcher: FetchSignature; };
export type URLOption = { url: string; };
export type FetchRetryOptions = Partial<FetchOption & LoggerOption & ShouldRetryOption> & URLOption & { tryCount?: number; };

/**
 * this is designed to follow redirects like https://t.co/F7MMJ14ghp
 * and also fetch json properly like https://gist.github.com/reggi/da769b879c48a542f743f6fe6363c724.json
 * and also fix an issue where this was not returning html https://github.com/delucis/astro-embed/tree/main/packages/astro-embed-twitter
 */
export const fetchFollowRedirects: FetchSignature = (input) => {
  return fetch(input, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    },
    "redirect": "follow",
  });
};

export async function fetchRetry(props: FetchRetryOptions) {
  const {
    fetcher = fetchFollowRedirects,
    logger = () => { },
    shouldRetry = () => false,
    tryCount = 1,
    url: inputUrl } = props;
  logger(`fetch`, inputUrl);
  const res = await fetcher(inputUrl);
  const valueOfShouldRetry = shouldRetry({ status: res.status, url: inputUrl });
  const { status, url } = res;
  const iLog = (message: string) => logger(message, { inputUrl, status, tryCount, url });
  if (valueOfShouldRetry) {
    iLog(`fetch retry`);
    return fetchRetry({ ...props, tryCount: tryCount + 1, url });
  }
  iLog(`fetch final`);
  return res;
}