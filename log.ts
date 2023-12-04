import chalk from 'chalk';

export function cacheLog(path: string): void {
  const timestamp = new Date().toLocaleTimeString();
  const appName = '[astro-cache]';
  const action = 'fetching';
  const msg = `${chalk.gray(timestamp)} ${chalk.hex('#ADD8E6')(appName)} ${chalk.green(action)} ${chalk.white(path)}`
  console.log(msg)
}
