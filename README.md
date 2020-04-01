# My2Cents
Implement logging in an existing website.

## Features:
- Tiny! It takes only ~**10 KB!!!** to embed My2Cents.
- **Open source** and **self-hosted**.
- Ad-free and Tracking-free. My2Cents will **not disturb your users**.
- It's simpy to moderate, with a **minimal** and **slick UI** to allow/reject comments or trust/block users.
- **[webpush protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-12) to notify the site owner** about new comments awaiting for moderation.
- **Third party providers for authentication** like Github, Twitter, Google and Facebook. Users are not required to register a new account on your system and you don't need to manage a user management system or bother about GDPR.

## Why I started building my2cents
I was looking for an embeddable commenting solution with the features described above, and found [Schnack](https://schnack.cool/). Unfortunately, it only offers support for SQLite, a no-go for production environments.

As a non JavaScript developer I found no better solution then porting schnackjs to Typescript and implement other database connections myself. I tried to stick to the original js implementation where possible, until I realized that the original solution suffered from Cross-site issues.

BTW: I am pretty new to TS also, so don't expect this to be the best code you ever saw.

### Quickstart => this is to be completed

This is the fastest way to setup *My2Cents*.

**Requirements**:
- Node.js (>= v6)
- npm (>= v5)

Clone or download My2Cents:

```bash
git clone https://github.com/jbouduin/my2cents
```

Go to the My2Cents directory:
```bash
cd my2cents
```

Install dependencies:
```bash
npm install
```

Copy and edit the config file according to *todo* section:

```bash

```

Run the server:
```bash
npm start
```

Embed in your HTML page:

```html
<div class="comments-go-here"></div>
<script src="https://site.example.com/my2cents/embed.js"
    data-my2cents-slug="post-slug"
    data-my2cents-target=".comments-go-here">
</script>
```

**or** initialize *My2Cents* programmatically:

```html
<div class="comments-go-here"></div>

<script src="http://site.example.com/my2cents/client.js"></script>
<script>
    new My2Cents({
        target: '.comments-go-here',
        slug: 'post-slug',
        host: 'http://site.example.com'
    });
</script>
```

### Configuration

**Notify Providers:**

* pushover
* webpush
* slack
* rss
* sendmail

to use webpush: generate keys by running npx web-push generate-vapid-keys

### Who is using My2Cents?

My2Cents will never track who is using it, so I don't know! If you are a My2Cents user, [let us know](https://twitter.com/agile_state) and I'll add your website here. So far My2Cents is being used on:

* https://agile-is-a-state-of-mind.com

### Similar projects

This is not a new idea, so there are a few projects that are doing almost the same thing:

* [CoralProject Talk](https://github.com/coralproject/talk) - Node + MongoDB + Redis
* [Discourse](https://github.com/discourse/discourse) - Ruby on Rails + PostgreSQL + Redis
* [Commento](https://github.com/adtac/commento) - Go + Node
* [Isso](https://github.com/posativ/isso/) - Python + SQLite3
* [Mouthful](https://mouthful.dizzy.zone) – Go + Preact
