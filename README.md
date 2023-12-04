# `astro-cache-embed`

I wrote a [dev.to](https://dev.to) article downloader a while back, [reggi/fetch-dev-to-articles](https://github.com/reggi/fetch-dev-to-articles), the goal being to start to host my own content on my own server. I've since made the switch for my personal site to use [Astro](https://astro.build/) and go fully static. I'm really happy making the switch. Since I was thinking about importing my articles over was was faced with an issue dev.to uses liquid embeds for things like tweets, youtube, and gists, so I was thinking of coming up with a "drop-in" replacement for this kind of syntax: 

```liquid
{% embed https://twitter.com/thomasreggi/status/1704311117273550892 %}
```

Somehting using `mdx` like :

```mdx
<Embed href="https://twitter.com/thomasreggi/status/1704311117273550892" />
```

So I sought out to create somekind of embed for `youtube`, `twitter`, `mastodon`, `audio`, `video`, `images`, webpage social `card`, and `gist`, and what I came up with was / is much more then a simple "embed". 

## Caching

Whether you're importing a blog from a site or you're caching an embed the same issue arrises, the content isn't localized. The content is coming from other servers, and therefore it's prone to link-rot. Astro like many other blogging projects, is designed to be a static-site generator, when it comes to implmenting an embed you have two options:

1) Your client can fetch the data (iframe, client-fetch, or embedable script)
2) Your server / build process can fetch the data (embeding static html on the page)

I chose the latter to have the build process fetch embed data and build the site with it. 

But there's a catch if you're building the site, what happens if you build in a month from now? You have to re-fetch all those dependencies again, and what if those services go down? In a world where sites like twitter have shut down their API's and getting tweet data is harder than ever it would be nice to know that my old embeds wont look like garbage one day, or worse, simply disapear. So I wanted to cache the embed data, I took this another step futher for media (images, audio, video) as well, I want to be able to build the site without a single fetch request, and have zero external dependencies. 

I started out using astros built in [content entity as a store, but quicky ran into issues](https://github.com/withastro/astro/issues/9204). I wanted something light weight to cache fetch requests based on the url, and chose to go with file-based sqlite db, because it will always be localized in the project folder.

