import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import type { HasherOption } from "./hasher";
import type { LoggerOption } from "./logger";

type UrlOption = { url: string; };
type DownloadLocationOption = { downloadLocation: string; };
type ScreenshotOptions = DownloadLocationOption & HasherOption & LoggerOption & UrlOption;

export async function takeScreenshot(props: ScreenshotOptions) {
  const { logger, downloadLocation, hasher, url, } = props;
  logger('screenshot', url);
  const hash = hasher(url);
  const filepath = "./" + path.join('public', downloadLocation, `${hash}.png`);
  logger(`screenshot write`, filepath);
  const src = "/" + path.join(downloadLocation, `${hash}.png`);
  await fs.mkdir(downloadLocation, { recursive: true });
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ height: 800, width: 1440 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto(url);
  await page.screenshot({ path: filepath });
  await browser.close();
  return { filepath, hash, src };
}