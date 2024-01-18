
export const truncateString = (s: string, l: number) => (s.length > l) ? s.slice(0, l) + '...' : s;
export const displayUrl = (u: string) => u.replace(/^(https?:\/\/)?(www\.)?/, '');
export const defaultTransformUrl = (u: string) => truncateString(displayUrl(u), 25);

export type TransformUrlHandler = (url: string) => string;
export type TransformUrlOption = { transformUrl?: TransformUrlHandler; };