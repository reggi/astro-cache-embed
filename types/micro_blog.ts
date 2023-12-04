import { type SocialType } from "../controllers/cache_card";
import type { Status } from "./mastodon";

export type ImageMedia = {
  id: string,
  src: string,
  alt: string,
  objectPosition: string
}[]

export type VideoMedia = {
  id: string,
  src: string,
  alt: string,
  poster: string,
}

export type AudioMedia = {
  src: string,
  poster: string,
}

export type Props = {
  date: string;
  displayName: string;
  html: string;
  profileImage?: any;
  profileUrl: string;
  social?: Partial<SocialType>;
  url: string;
  username: string
  images?: ImageMedia
  video?: VideoMedia
  poll?: Status['poll']
  audio?: AudioMedia,
  class?: string
};

export type MicroBlogProps = Props