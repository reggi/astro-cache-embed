import { type CheerioAPI, load } from 'cheerio';
import type { FetcherOption } from '../../plugins';
import type { Payload } from '../../cache_fetch';
import { defaultTransformUrl, type TransformUrlOption } from './transform_url';

const TWITTER_URLS = ['twitter.com', 'x.com'];

type CheerioDocumentOption = { $: CheerioAPI; };

async function expandShortUrls(props: CheerioDocumentOption & FetcherOption & TransformUrlOption) {
  const { $, transformUrl = defaultTransformUrl } = props;
  const { fetcher } = props;
  const anchorElements = $('a[href^="https://t.co/"]'); // Select all anchor tags with 't.co' URLs
  const urls: Payload[] = [];
  for (let i = 0; i < anchorElements.length; i++) {
    const elem = anchorElements[i];
    const e = $(elem);
    const shortUrl = e.attr('href');
    if (shortUrl) {
      const resolved = await fetcher(shortUrl);
      e.attr('href', resolved.resolvedUrl); // Replace the href attribute with the final URL
      e.text(transformUrl(resolved.resolvedUrl));
      urls.push(resolved);
    }
  }
  return urls.filter(v => {
    const u = new URL(v.resolvedUrl);
    return !TWITTER_URLS.includes(u.hostname);
  });
}

function removeQueryParameters(url: string, paramsToRemove: string[]): string {
  const urlObj = new URL(url);
  paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
  return urlObj.toString();
}

function replaceAnchorDomain(props: CheerioDocumentOption & {
  domains: string[],
  replacement: string;
}) {
  const { $, domains, replacement } = props;
  $('a').each(function () {
    const href = $(this).attr('href');
    if (href) {
      const url = new URL(href);
      if (domains.includes(url.hostname)) {
        url.hostname = replacement;
        $(this).attr('href', removeQueryParameters(url.href, ['ref_src']));
        const text = $(this).text();
        if (text.includes(url.hostname)) {
          $(this).text(text.replace(url.hostname, replacement));
        }
      }
    }
  });
}

function removeUnwantedtext(props: CheerioDocumentOption) {
  const { $ } = props;
  const blockquote = $('blockquote.twitter-tweet');
  // Iterate over child nodes of the blockquote
  blockquote.contents().each((_index, element) => {
    // Check if the node is a text node and not within a <p> tag
    if (element.type === 'text' && element?.parent && element?.parent['name'] !== 'p') {
      $(element).remove();
    }
  });
}

type ReusableOptions = FetcherOption & ProxyUrlOption & TransformUrlOption;

async function parseViaCheerio(props: CheerioDocumentOption & ReusableOptions) {
  const { proxyUrl, fetcher, transformUrl, $ } = props;
  const urls = await expandShortUrls({ $, fetcher, transformUrl });
  proxyUrl && replaceAnchorDomain({ $, domains: TWITTER_URLS, replacement: proxyUrl });
  const lastAnchor = $('blockquote').find('a').last();
  const date = lastAnchor.text();
  lastAnchor.remove();
  $('script').remove();
  removeUnwantedtext({ $ });
  const social = urls[urls.length - 1];
  $('body blockquote').attr('style', `line-height: 1`);
  const body = $('body').html() || undefined;
  return { date, html: body?.replace(/\n+$/, ''), social, urls };
}

export type ProxyUrlOption = { proxyUrl?: string; };
export type HtmlOption = { html: string; };

export async function parse(props: HtmlOption & ReusableOptions) {
  const { proxyUrl, fetcher, transformUrl, html } = props;
  const $ = load(html);
  return parseViaCheerio({ $, fetcher, proxyUrl, transformUrl });
}
