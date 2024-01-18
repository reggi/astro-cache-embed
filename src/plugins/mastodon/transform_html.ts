import { load, type CheerioAPI } from "cheerio";
import { defaultTransformUrl, type TransformUrlOption } from "../twitter/transform_url";

type CheerioDocumentOption = { $: CheerioAPI; };

function truncateUrls(props: CheerioDocumentOption & TransformUrlOption) {
  const { $, transformUrl = defaultTransformUrl } = props;
  const anchorElements = $('a'); // Select all anchor tags with 't.co' URLs
  for (let i = 0; i < anchorElements.length; i++) {
    const elem = anchorElements[i];
    const shortUrl = $(elem).attr('href');
    if (shortUrl) {
      const e = $(elem);
      const text = e.text();
      e.text(transformUrl(text));
    }
  }
}

function addParagraphPadding(props: CheerioDocumentOption) {
  const { $ } = props;
  const anchorElements = $('p');
  for (let i = 0; i < anchorElements.length; i++) {
    const elem = anchorElements[i];
    $(elem).attr('style', 'margin-bottom: 1rem;');
  }
}

function transformViaCheerio(props: CheerioDocumentOption & TransformUrlOption) {
  const { $, transformUrl } = props;
  truncateUrls({ $, transformUrl });
  addParagraphPadding({ $ });
  return $('body').html();
}

export function transformHtml(props: TransformUrlOption & { html: string; }) {
  const { transformUrl, html } = props;
  const $ = load(html);
  return transformViaCheerio({ $, transformUrl }) || props.html;
}
