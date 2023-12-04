import { load, type CheerioAPI } from 'cheerio';
import type { CacheFetchType } from '../models/fetch';
import { cacheFetch, type CacheFetchOptions } from './cache_fetch';

export type WebpageMetadata = {
  title: string;
  description: string;
  ogDescription: string;
  ogTitle: string;
  ogUrl: string;
  ogSiteName: string;
  ogImage: string;
  twitterTitle: string;
  twitterCard: string;
  twitterImage: string;
  twitterDescription: string;
  keywords: string[];
  themeColor: string;
  icon: string;
}

export type SocialType = CacheFetchType & WebpageMetadata & {
  href: string
}

export class SocialParser {
  $: CheerioAPI;

  constructor(html: string) {
    this.$ = load(html);
  }
  
  init (): WebpageMetadata {
    return {
      title: this.title,
      description: this.description,
      ogDescription: this.ogDescription,
      ogTitle: this.ogTitle,
      ogUrl: this.ogUrl,
      ogSiteName: this.ogSiteName,
      ogImage: this.ogImage,
      twitterTitle: this.twitterTitle,
      twitterCard: this.twitterCard,
      twitterImage: this.twitterImage,
      twitterDescription: this.twitterDescription,
      keywords: this.keywords,
      themeColor: this.themeColor,
      icon: this.icon
    }
  }

  static init (html: string) {
    return new SocialParser(html).init()
  }

  get title() {
    return this.$('title').text()
  }

  get description() {
    return this.$('meta[name="description"]').attr('content');
  }

  get ogDescription() {
    return this.$('meta[property="og:description"]').attr('content');
  }

  get ogTitle() {
    return this.$('meta[property="og:title"]').attr('content');
  }

  get ogUrl() {
    return this.$('meta[property="og:url"]').attr('content');
  }

  get ogSiteName() {
    return this.$('meta[property="og:site_name"]').attr('content');
  }

  get ogImage () {
    return this.$('meta[property="og:image"]').attr('content');
  }

  get twitterTitle() {
    return this.$('meta[name="twitter:title"]').attr('content');
  }

  get twitterCard() {
    return this.$('meta[name="twitter:card"]').attr('content');
  }

  get twitterImage() {
    return this.$('meta[name="twitter:image"]').attr('content');
  }

  get twitterDescription() {
    return this.$('meta[name="twitter:description"]').attr('content');
  }

  get keywords() {
    const kw = this.$('meta[name="keywords"]').attr('content')
    if (kw) return kw.split(',').map(v => v.trim())
    return []
  }

  get themeColor() {
    return this.$('meta[name="theme-color"]').attr('content');
  }

  get icon() {
    let largestIcon = '';
    let maxSize = 0;

    this.$('link[rel="icon"], link[rel="apple-touch-icon"]').each((_i, el) => {
      const iconHref = this.$(el).attr('href');
      const sizeAttr = this.$(el).attr('sizes');
      if (sizeAttr) {
        const sizes = sizeAttr.split('x');
        if (sizes.length === 2) {
          const size = parseInt(sizes[0], 10) * parseInt(sizes[1], 10);
          if (size > maxSize) {
            maxSize = size;
            largestIcon = iconHref;
          }
        }
      }
    });

    return largestIcon;
  }
}

export const cacheWebpageSocialCard = (webpage: CacheFetchType): Partial<SocialType> => {
  if (!webpage || !webpage.html) return null
  const data = SocialParser.init(webpage.html)
  return {...webpage, href: webpage.resolvedUrl, ...data}
}

export const cacheSocialCard = async (href: string, options: CacheFetchOptions = {}) => {
  const webpage = await cacheFetch(href, options)
  return cacheWebpageSocialCard(webpage)
}
