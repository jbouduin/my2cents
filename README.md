# My2Cents
[My2Cents](https://en.wikipedia.org/wiki/My_two_cents) is an embeddable commenting system written in JavaScript.

## Features:
- Tiny! It takes only ~**10 KB!!!** to embed My2Cents.
- **Open source** and **self-hosted**.
- Ad-free and Tracking-free. My2Cents will **not disturb your users**.
- It's simpy to moderate, with a **minimal** and **slick UI** to allow/reject comments or trust/block users.
- **[webpush protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-12) to notify the site owner** about new comments awaiting for moderation.
- **Third party providers for authentication** like Github, Twitter, Google and Facebook. Users are not required to register a new account on your system and you don't need to manage a user management system or bother about GDPR.

## Why I started building my2cents
I was looking for an embeddable commenting solution with the features described above for [my blog](https://agile-is-a-state-of-mind), and found [Schnack](https://schnack.cool/). Unfortunately, it only offers support for SQLite, a no-go for production environments.

As a non JavaScript developer I found no better solution then porting schnackjs to Typescript and implement other database connections myself. I tried to stick to the original js implementation where possible, until I realized that the original solution severely suffered from Cross-site issues.

BTW: I am pretty new to TS, so don't expect this to be the best code you ever saw. Please let me know, if you find code issues by [creating the appropriate issue](https://github.com/jbouduin/my2cents/issues). I'm grateful if you teach me something.

### Quickstart

This is the fastest way to setup *My2Cents* on your local workstation.

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

* https://agile-is-a-state-of-mind.com

### Similar projects

This is not a new idea, so there are a few projects that are doing almost the same thing:

* [CoralProject Talk](https://github.com/coralproject/talk) - Node + MongoDB + Redis
* [Discourse](https://github.com/discourse/discourse) - Ruby on Rails + PostgreSQL + Redis
* [Commento](https://github.com/adtac/commento) - Go + Node
* [Isso](https://github.com/posativ/isso/) - Python + SQLite3
* [Mouthful](https://mouthful.dizzy.zone) – Go + Preact
