import { load, type CheerioAPI } from 'cheerio';

const getCommonStartingWords = (str1: string, str2: string): string => {
  const commonStart: string[] = [];
  const a = str1.split(/\s/);
  const b = str2.split(/\s/);
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] === b[i]) {
      commonStart.push(a[i]);
    } else {
      break;
    }
  }
  return commonStart.join(' ');
};

const trimFloatingNonAlphaNumeric = (input: string): string => {
  return input.trim().replace(/(^\s*[^a-zA-Z0-9]+\s)|(\s[^a-zA-Z0-9]+\s*$)/g, '');
};

/** some sites like github have a duplicated b in the aription */
const getConsolidatedSentence = (a?: string, b?: string) => {
  if (!a) return '';
  if (!b) return trimFloatingNonAlphaNumeric(a).trim();
  const c = getCommonStartingWords(a, b);
  const d = trimFloatingNonAlphaNumeric(a.replace(b, '')).trim();
  return trimFloatingNonAlphaNumeric(d.replace(c, '')).trim();
};

const getAbsoluteUrl = (fullUrl: string, imageUrl?: string): string | undefined => {
  if (!imageUrl || imageUrl === '') return undefined;
  if (imageUrl.startsWith('http')) return imageUrl;
  const origin = new URL(fullUrl).origin;
  const result = new URL(imageUrl, origin);
  const res = result.toString();
  if (res === origin) return undefined;
  if (`${res}/` === origin) return undefined;
  if (`${res}` === `${origin}/`) return undefined;
  return res;
};

const metaSelector = (key: string) => `meta[property="${key}"], meta[name="${key}"]`;
const getMetadata = ($: CheerioAPI) => {
  const split = (kw: string | undefined) => (kw) ? kw.split(',').map(v => v.trim()) : [];
  const icons = getAllIcons($);
  return ({
    applicationName: $(metaSelector("application-name")).attr('content'),
    byl: $(metaSelector("byl")).attr('content'),
    canonical: $('link[rel="canonical"]').attr('href'),
    description: $(metaSelector("description")).attr('content'),
    icon: getLargestIcon(icons),
    icons,
    keywords: split($(metaSelector("keywords")).attr('content')),
    newsKeywords: split($(metaSelector("news_keywords")).attr('content')),
    ogDescription: $(metaSelector("og:description")).attr('content'),
    ogImage: $(metaSelector("og:image")).attr('content'),
    ogImageAlt: $(metaSelector("og:image:alt")).attr('content'),
    ogSiteName: $(metaSelector("og:site_name")).attr('content'),
    ogTitle: $(metaSelector("og:title")).attr('content'),
    ogType: $(metaSelector("og:type")).attr('content'),
    ogUrl: $(metaSelector("og:url")).attr('content'),
    themeColor: $(metaSelector("theme-color")).attr('content'),
    title: $('title').text(),
    twitterCard: $(metaSelector("twitter:card")).attr('content'),
    twitterDescription: $(metaSelector("twitter:description")).attr('content'),
    twitterImage: $(metaSelector("twitter:image")).attr('content'),
    twitterImageAlt: $(metaSelector("twitter:image:alt")).attr('content'),
    twitterTitle: $(metaSelector("twitter:title")).attr('content'),
    twitterUrl: $(metaSelector("twitter:url")).attr('content'),
  });
};

type Icons = { href: string, size: number }[]
const getAllIcons = ($: CheerioAPI): Icons => {
  const icons: { href: string, size: number }[] = [];
  $('link[rel="shortcut icon"], link[rel="image_src"], link[rel="icon"], link[rel="apple-touch-icon"]').each((_i, el) => {
    const href = $(el).attr('href');
    const sizeAttr = $(el).attr('sizes');
    let size = 0;
    if (sizeAttr) {
      const sizes = sizeAttr.split('x');
      if (sizes.length === 2) {
        size = parseInt(sizes[0], 10) * parseInt(sizes[1], 10);
      }
    }
    if (href) {
      icons.push({ href, size });
    }
  });
  return icons;
};

const getLargestIcon = (icons: Icons): string | undefined => {
  let largestIcon: string | undefined;
  let maxSize = 0;
  icons.forEach(icon => {
    if (icon.size > maxSize) {
      maxSize = icon.size;
      largestIcon = icon.href;
    } else if (icon.size === 0 && !largestIcon) {
      // If no size is specified, choose the first icon without a size as a fallback
      largestIcon = icon.href;
    }
  });
  return largestIcon;
};

export const SIZELARGE = 'large' as const;
export const SIZESMALL = 'small' as const;

type Size = typeof SIZELARGE | typeof SIZESMALL;

const SUMMARYLARGE = 'summary_large_image';
const SUMMARY = 'summary';

const getSocialDataFromCheerio = ($: CheerioAPI) => {
  const data = getMetadata($);
  // console.log($('head').html());
  // console.log({ data });
  const image = data.ogImage || data.twitterImage;
  const title = data.title || data.ogTitle || data.twitterTitle;
  const alt = data.ogImageAlt || data.twitterImageAlt;
  const icon = data.icon;
  const description = data.description || data.ogDescription || data.twitterDescription;
  const size: Size = (() => {
    if (data.twitterCard === SUMMARYLARGE) return SIZELARGE;
    if (data.twitterCard === SUMMARY) return SIZESMALL;
    if (image) return SIZELARGE;
    return SIZESMALL;
  })();
  const themeColor = data.themeColor;
  return { alt, description, icon, image, size, themeColor, title };
};

type SocialDataReturnType = ReturnType<typeof getSocialDataFromCheerio>;

const dedupeTitleDescriptionHandler = (v: SocialDataReturnType, handler: (a?: string, b?: string) => string): SocialDataReturnType => {
  const { description: rawDescription, title: rawTitle } = v;
  const description = handler(rawDescription, rawTitle);
  const title = handler(rawTitle, description);
  return { ...v, description, title };
};

/** gets consolidated metadata tags from a html webpage */
const getSocialDataFromHtml = (
  html: string,
  url: string,
): SocialData => {
  const $ = load(html);
  const data = dedupeTitleDescriptionHandler(
    getSocialDataFromCheerio($),
    getConsolidatedSentence
  );
  const domain = new URL(url).hostname;
  data.icon = getAbsoluteUrl(url, data.icon);
  data.image = getAbsoluteUrl(url, data.image);
  return { ...data, $, domain, url };
};

export type SocialData = {
  $?: CheerioAPI;
  alt?: string;
  description?: string;
  domain: string;
  icon?: string;
  image?: string;
  size: Size;
  themeColor?: string;
  title?: string;
  url: string
};

const parse = getSocialDataFromHtml;

export { parse };

