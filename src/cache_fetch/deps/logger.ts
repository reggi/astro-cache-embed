import chalk from 'chalk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifyAndHighlight(input: any): string {
  let jsonString: string;
  // Check the type of the input and process accordingly
  if (typeof input === 'object' && input !== null) {
    jsonString = JSON.stringify(input)
      .replace(/["{}]/g, '') // Remove ", {, and }
      .replace(/,/g, ' '); // Replace commas with space
  } else {
    // For non-object types, just convert to string
    jsonString = input.toString();
    return (jsonString);
  }
  // Apply highlighting
  const highlighted = jsonString.replace(/([^ :]+):([^ ,]+)/g, (_match, key, value) => {
    return chalk.blue(key) + " " + value;
  });
  return highlighted;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logger(action: string, data: any): void {
  const timestamp = new Date().toLocaleTimeString();
  const appName = '[astro-cache]';
  const prettyAction = action;
  const stringified = stringifyAndHighlight(data);
  const msg = `${chalk.gray(timestamp)} ${chalk.hex('#ADD8E6')(appName)} ${chalk.green(prettyAction)} ${stringified}`;
  console.log(msg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Logger = (id: string, data: any) => void;
export type LoggerOption = { logger: Logger; };