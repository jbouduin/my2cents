# My2Cents
[My2Cents](https://en.wikipedia.org/wiki/My_two_cents) is an embeddable commenting system written in JavaScript.

*My2Cents* is Licensed under the EUPL-1.2-or-later.

## This is still a work in progress
This means that a lot of the features have not been tested.

## Features:
- **Tiny**: it takes only ~**14 KB!!!** to embed My2Cents.
- **Open source** and **self-hosted**.
- **Ad-free**: *My2Cents* will not disturb your users.
- **Tracking-free**
- **Multiple databases supported**: SQLite3, Postgres and MySQL databases
- **Moderation**: with a *minimal* and *slick UI* a site administrator can allow/reject comments or trust/block users.
- **Notifications**: as a site owner, you can get notified about new comments awaiting moderation.
  - [webpush protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-12)
  - slack
  - mail
  - pushover
- **Third party providers for authentication**: users are not required to register a new account and you don't need to manage a user management system or bother about GDPR.
 - Github
 - Twitter
 - Google
 - Facebook
 - Instagram
 - LinkedIn

## Why I started building my2cents
I was looking for an embeddable commenting solution with the features described above for [my blog](https://agile-is-a-state-of-mind), and found [Schnack](https://schnack.cool/). Unfortunately, it only offers support for SQLite, a personal no-go for production environments.

As a non JavaScript developer I found no better solution then trying to port schnackjs to Typescript and implement other database connections myself. I tried to stick to the original implementation, until I realized that the original solution severely suffered from Cross-site issues. So in the end My2Cents became a completely different product.

BTW: I am pretty new to TS, so don't expect this to be the best code you ever saw. Please let me know, if you find code issues by [creating the appropriate issue](https://github.com/jbouduin/my2cents/issues). I'm eager to learn.

### Quickstart

This is the fastest way to setup *My2Cents* on your local workstation and give it a try.

**Requirements**:
- Node.js (>= v6)
- npm (>= v5)
- [Optional] git

Clone (if you have git) or download My2Cents from Github:

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

Run the *My2Cents server*:
```bash
npm run dev
```

In another terminal window, in the my2cents directory, run the *Test web server*:
```bash
npm run start-hosting-server
```

You can now browse to http://localhost:8080.

---

### Documentation
- [Installation](/docs/installation/installation.md)
  - [Installing from Source](/docs/installation/from-source.md)
  - [Configuring the My2Cents Server](/docs/installation/configuration.md)
  - [Starting My2Cents](/docs/installation/starting.md)
  - [Configuring Nginx](/docs/installation/nginx.md)
- [Using My2Cents](/docs/using-my2cents)
  - [Embedding in your HTML](/docs/using-my2cents/embedding.md)
  - [Style-sheets](/docs/using-my2cents/style-sheets.md)
- [Contributing](/docs/contributing/contributing.md)
  - [Creating issues](/docs/contributing/creating-issues.md)
  - [Develop](/docs/contributing/develop.md)
    - [Definition of Done](/docs/contributing/definition-of-done.md)
    - [Coding guidelines](/docs/contributing/coding-guidelines.md)
    - [Pull Requests](/docs/contributing/pull-requests.md)

### Who is using My2Cents?

My2Cents will never track who is using it, so I don't know! If you are a My2Cents user, [let me know](https://twitter.com/agile_state) and I'll add your website here. So far My2Cents is being used on:

- https://agile-is-a-state-of-mind.com

### Similar projects

This is not a new idea, so there are a few projects that are doing almost the same thing:

- [Schnack](https://github.com/jbouduin/schnack) - Node + SQLite3
- [CoralProject Talk](https://github.com/coralproject/talk) - Node + MongoDB + Redis
- [Discourse](https://github.com/discourse/discourse) - Ruby on Rails + PostgreSQL + Redis
- [Commento](https://github.com/adtac/commento) - Go + Node
- [Isso](https://github.com/posativ/isso/) - Python + SQLite3
- [Mouthful](https://mouthful.dizzy.zone) – Go + Preact
