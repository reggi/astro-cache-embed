
type ResponseResult = {
  url: string;
  status: number;
  contentType: string;
  html?: string;
  // deno-lint-ignore no-explicit-any
  json?: any;
  hash?: string,
  src?: string,
  filepath?: string;
};

export type DownloadDecider = (response: Response) => boolean;
export type Downloader = (response: Response) => Promise<{ hash: string, src: string, filepath: string; }>

async function handleResponse(props: {
  response: Response;
  shouldDownload?: DownloadDecider
  downloader: Downloader;
}): Promise<ResponseResult> {
  const { response } = props;
  const url = response.url;
  const status = response.status;
  const contentType = response.headers.get('content-type') || '';
  const isHtml = contentType.startsWith('text/html');
  const isJson = contentType.startsWith('application/json');
  const common = { contentType, status, url };
  const { shouldDownload, downloader } = props;
  if (isHtml) {
    const html = await response.text();
    return { ...common, html };
  } else if (isJson) {
    try {
      const json = await response.json();
      return { ...common, json };
    } catch {
      return { ...common, status: 404 };
    }
  } else if (shouldDownload && shouldDownload(response)) {
    const data = await downloader(response);
    return { ...common, ...data };
  }
  return { ...common, src: url };
}

export { handleResponse };
