import tailwindColors from 'tailwindcss/colors';

export type InputClass = {
  class?: string;
  className?: string;
  classname?: string;
  classList?: string[];
};

export function resolveClassName (props: InputClass) {
  const { class: c, className: cn, classname, classList } = props;
  return { className: c || cn || classname || (classList || []).join(' ') };
}

export type InputURL = 
  { href: string;} | { src: string; } | { url: string; };

export function resolveURL(i: InputURL): string {
  if ('url' in i && i.url !== undefined) return i.url;
  if ('href' in i && i.href !== undefined) return i.href;
  if ('src' in i && i.src !== undefined) return i.src;
  throw new Error('url, src, href required');
}

export function withoutInputUrl <G>(input: G): Omit<G, 'href' | 'src' | 'url'>{
  const { url: _url = undefined, href: _href = undefined, src: _src = undefined, ...rest } = {...input};
  return rest as G;
}

export type CoreProps = InputClass & InputURL 
export type WithoutInputUrl<T> = Omit<T, 'href' | 'src' | 'url'>;
export type WithoutInputClass<T> = Omit<T, keyof InputClass>;
export type withoutCoreProps<T> = WithoutInputUrl<WithoutInputClass<T>>;

export function resolveProps<T extends Record<string, unknown>, G extends CoreProps & T>(i: G) {
  const { url: u, href, src, ...rest } = i;
  const jest = rest as withoutCoreProps<G>;
  const url = resolveURL({ href, src, url: u } as any);
  const { className } = resolveClassName(i);
  const custom = { className, url };
  return { ...custom, ...jest };
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    b: parseInt(result[3], 16),
    g: parseInt(result[2], 16),
    r: parseInt(result[1], 16),
  } : null;
};

const luminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const isLightColor = (color: string) => {
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      const lum = luminance(rgb.r, rgb.g, rgb.b);
      return lum > 0.5;
    }
  }
  // Assume named colors are light
  return true;
};

export const textColorBasedOnBackgroundColor = (bgColor: string) => {
  if (isLightColor(bgColor)) {
    return 'black';
  }
  return 'white';
};

export function bgColorHexFromClasses (className?: string) {
  if (!className) return undefined;
  const color = className?.split(' ').find(v => v.startsWith('bg-'));
  if (!color) return undefined;
  const bg = color && color.split('-') || [];
  const hex = tailwindColors[bg[1]][bg[2]];
  return hex;
}
