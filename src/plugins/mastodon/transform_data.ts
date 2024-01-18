import type { Fetcher } from '..';
import type { MicroBlogProps } from '../../components/MicroBlog.astro';
import type { Status } from './types';

type MastodonAudio = {
  src: string;
};

function resolveAudioAttachments(status: Status): MastodonAudio[] {
  return status.media_attachments
    .filter(media => media.type == 'audio')
    .map(media => ({ src: media.url }));
}

type MastodonVideo = {
  alt: string;
  id: string;
  poster: string;
  src: string;
};

function resolveVideoAttachments(status: Status): MastodonVideo[] {
  return status.media_attachments
    .filter(media => media.type == 'video')
    .map(media => ({
      alt: media.description,
      id: media.id,
      poster: media.preview_url,
      src: media.url,
    }));
}

function decimalToPercent(decimal: number) {
  return decimal * 100;
}

function percentOfNumber(percent: number, number: number) {
  return (percent / 100) * number;
}

type Coords = { x: number, y: number; };

function transformCoordinates(coords: Coords): Coords {
  const { x: inputX, y: inputY } = coords;
  const x = 50;
  const y = 50;
  const xDifference = percentOfNumber(decimalToPercent(inputX), x);
  const xOut = x + xDifference;

  const yDifference = percentOfNumber(decimalToPercent(inputY), y);
  const yOut = y - yDifference;
  return { x: xOut, y: yOut };
}

function coordsToObjectPosition(coords: Coords) {
  return `object-position: ${coords.x}% ${coords.y}%`;
}

type MastodonImage = {
  alt: string;
  id: string;
  objectPosition: any;
  src: string;
};

function resolveImageAttachments(status: Status): MastodonImage[] {
  return status.media_attachments
    .filter(media => {
      return media.type == 'image';
    })
    .map(media => {
      return {
        alt: media.description,
        id: media.id,
        objectPosition: media.meta.focus && coordsToObjectPosition(transformCoordinates(media.meta.focus)),
        src: media.url,
      };
    });
}

function formatDate(dateString: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}, ${year}`;
}

function getFullUsername(status: Status) {
  const url = new URL(status?.account?.url).hostname;
  const username = status?.account?.acct;
  return `@${username}@${url}`;
}

type TransformHtml = (html: string) => string;

// export type MastodonStatus = {
//   audio: {
//     poster: string;
//     src: string;
//   } | undefined;
//   date: string;
//   displayName: string;
//   favouritesCount: number;
//   html: string;
//   images: MastodonImage[];
//   poll: Status['poll'] | null;
//   profileImage: string;
//   profileUrl: string;
//   reblogsCount: number;
//   repliesCount: number;
//   social: SocialData | undefined;
//   url: string | null;
//   username: string;
//   video: MastodonVideo;
// };

export type MastodonMicroBlogProps = MicroBlogProps & {
  favouritesCount: number;
  reblogsCount: number;
  repliesCount: number;
}

// function socialDataFromMastodonCard (data: Status) {
//   return data.card ? {
//     description: data.card.description,
//     domain: new URL(data.card.url).hostname,
//     image: data.card.image === null ? undefined : data.card.image,
//     size: data.card.width < 500 ? 'small' : 'large',
//     title: data.card.title,
//     url: data.card.url,
//   } : undefined;
// }

async function transformMastodonStatus(props: { status: Status; transformHtml: TransformHtml; fetcher: Fetcher }): Promise<MastodonMicroBlogProps> {
  const { fetcher, status: data, transformHtml } = props;
  if (data.url === null) throw new Error('No URL found');
  const audio = resolveAudioAttachments(data)[0];
  if (audio) {
    const audioSrc = (await fetcher(audio.src)).src;
    if (audioSrc) audio.src = audioSrc;
  }
  const video = resolveVideoAttachments(data)[0];
  if (video) {
    const videoSrc = (await fetcher(video.src)).src;
    if (videoSrc) video.src = videoSrc;
  }
  const image = resolveImageAttachments(data);
  const cardPayload = data.card?.url ? await fetcher(data.card.url) : undefined;
  const socialData = cardPayload?.socialData;
  const hasAttachment = audio || video || image.length > 0 || data.poll;
  // console.log({ cardPayload });
  return {
    audio: audio ? { ...audio, poster: data.account.avatar, } : undefined,
    date: formatDate(data.created_at),
    displayName: data.account.display_name,
    favouritesCount: data.favourites_count,
    html: transformHtml(data.content),
    images: resolveImageAttachments(data),
    poll: data.poll,
    profileImage: data.account.avatar,
    profileUrl: data.account.url,
    reblogsCount: data.reblogs_count,
    repliesCount: data.replies_count,
    social: hasAttachment ? undefined : socialData,
    url: data.url,
    username: getFullUsername(data),
    video: video,
  };
}

export const transformData = transformMastodonStatus;
