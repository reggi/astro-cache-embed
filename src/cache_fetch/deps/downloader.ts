import fs from 'node:fs/promises';
import path from 'node:path';
import type { HasherOption } from './hasher';
import type { LoggerOption } from './logger';

type ResponseOption = { response: Response; };
type ResolveExtension = (...url: (URL | string)[]) => string;
type ResolveExtensionOption = { resolveExtension: ResolveExtension; };
type DownloadLocation = { downloadLocation: string; };
type DownloaderOptions = DownloadLocation & HasherOption & LoggerOption & ResolveExtensionOption & ResponseOption;

export async function downloader(options: DownloaderOptions) {
  const { downloadLocation, response, hasher, resolveExtension, logger } = options;
  const contentType = response.headers.get('content-type') || '';
  const extension = resolveExtension(new URL(response.url), contentType);
  const hash = hasher(response.url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.mkdir(downloadLocation, { recursive: true });
  const filepath = "./" + path.join('public', downloadLocation, `${hash}${extension}`);
  logger('writing file', filepath);
  await fs.writeFile(filepath, buffer);
  const src = "/" + path.join(downloadLocation, `${hash}${extension}`);
  return { filepath, hash, src };
}