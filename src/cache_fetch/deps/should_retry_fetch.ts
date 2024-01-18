import type { PlainRequest as Request, ShouldRetry } from './fetch_retry.ts';

type RetryOption = {
  hostname?: string,
  status?: number[] | number,
  notStatus?: number[] | number,
  retries?: number;
};


class RetryHostname {
  hostname?: string;
  status?: number[];
  notStatus?: number[];
  retries: number;
  constructor(input: RetryOption) {
    const { hostname, status, notStatus = 200, retries = 15 } = input;
    this.hostname = hostname;
    this.status = Array.isArray(status) ? status : status ? [status] : [];
    this.notStatus = Array.isArray(notStatus) ? notStatus : notStatus ? [notStatus] : [];
    this.retries = retries;
  }
  statusMatch(statusNumber: number): boolean {
    const isInStatus = this.status?.includes(statusNumber) ?? false;
    const isNotInNotStatus = (this.notStatus && this.notStatus.length && !this.notStatus?.includes(statusNumber)) || false;
    return isInStatus || isNotInNotStatus;
  }
  shouldRetry(request?: Request, count = 1) {
    if (!request) return false;
    const { url, status } = request;
    const hostname = new URL(url).hostname;
    const hostnameMatch = this.hostname ? this.hostname === hostname : true;
    const statusMatch = this.statusMatch(status);
    return hostnameMatch && statusMatch && this.retries >= count;
  }
}

type SingularRetryOption = RetryOption | string;
type RetryOptions = SingularRetryOption | SingularRetryOption[];

class RetryHostnames {
  retryHostnames: RetryHostname[];
  constructor(args: RetryOptions, defaults?: RetryOption) {
    const handleSingle = (args: SingularRetryOption) => {
      if (typeof args === 'string') return [new RetryHostname({ ...defaults, hostname: args })];
      return [new RetryHostname({ ...args, ...defaults })];
    };
    this.retryHostnames = Array.isArray(args) ? args.flatMap(arg => handleSingle(arg)).flat() : handleSingle(args);
  }
  shouldRetry(request?: Request, count?: number) {
    if (!this.retryHostnames.length) return false;
    const match = this.retryHostnames.some(retryHostname => retryHostname.shouldRetry(request, count));
    return match;
  }
  static create(args?: RetryOptions, defaults?: RetryOption) {
    return new RetryHostnames(args || [], defaults);
  }
  static shouldRetry(args?: RetryOptions, defaults?: RetryOption) {
    return (...predicateArgs: Parameters<ShouldRetry>) => {
      if (!args) return false;
      return RetryHostnames.create(args, defaults).shouldRetry(...predicateArgs);
    };
  }
}

export type { RetryOption, RetryOptions };
export const shouldRetryFetch = RetryHostnames.shouldRetry;
