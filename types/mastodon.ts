type Field = {
  name: string
  value: string
  verified_at: string | null
}

type CustomEmoji = {
  shortcode: string
  url: string
  static_url: string
  visible_in_picker: boolean
  category: string
}

type Account = {
  id: string
  username: string
  acct: string
  url: string
  display_name: string
  note: string
  avatar: string
  avatar_static: string
  header: string
  header_static: string
  locked: boolean
  fields: Field[]
  emojis: CustomEmoji[]
  bot: boolean
  group: boolean
  discoverable: boolean | null
  noindex?: boolean | null
  moved?: boolean | null
  suspended?: boolean
  limited?: boolean
  created_at: string
  last_status_at: string | null
  statuses_count: number
  followers_count: number
  following_count: number
}

type MediaAttachment = {
  id: string
  type: string
  url: string
  preview_url: string
  remote_url: string | null
  meta: {[key: string]: any}
  description: string
  blurhash: string
}

type PollOption = {
  title: string
  votes_count: number | null
}

type Poll = {
  id: string
  expires_at: string | null
  expired: boolean
  multiple: boolean
  votes_count: number
  voters_count: number | null
  options: PollOption[]
  emojis: CustomEmoji[]
  voted?: boolean
  own_votes?: number[]
}

type PreviewCard = {
  url: string
  title: string
  description: string
  type: string
  author_name: string
  author_url: string
  provider_name: string
  provider_url: string
  html: string
  width: number
  height: number
  image: string | null
  embed_url: string
  blurhash: string | null
  language: string | null // not defined in docs
}

type StatusMention = {
  id: string
  username: string
  url: string
  acct: string
}

type StatusTag = {
  name: string
  url: string
}

export type Status = {
  id: string
  uri: string
  created_at: string
  account: Account
  content: string
  visibility: string
  sensitive: boolean
  spoiler_text: string
  media_attachments: MediaAttachment[]
  application: any
  mentions: StatusMention[]
  tags: StatusTag[]
  emojis: CustomEmoji[]
  reblogs_count: number
  favourites_count: number
  replies_count: number
  url: string | null
  in_reply_to_id: string | null
  in_reply_to_account_id: string | null
  reblog: Status | null
  poll: Poll | null
  card: PreviewCard | null
  language: string | null
  text: string | null
  edited_at: string | null
  favourited?: boolean
  reblogged?: boolean
  muted?: boolean
  bookmarked?: boolean
  pinned?: boolean
  filtered: any
}