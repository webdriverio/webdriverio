name: Browserstack
category: services
tags: guide
index: 1
title: WebdriverIO - Browserstack Service
---

Browserstack Service
====================

A WebdriverIO service that manages local tunnel and job metadata for Browserstack users.

## Installation

Simply run:

```bash
npm install --save-dev wdio-browserstack-service
```

## Configuration

WebdriverIO has Browserstack support out of the box. You should simply set `user` and `key` in your `wdio.conf.js` file. This service plugin provdies supports for [Browserstack Tunnel](https://wiki.saucelabs.com/display/DOCS/Using+Sauce+Connect+for+Testing+Behind+the+Firewall+or+on+Localhost). Set `browserstackLocal: true` also to activate this feature.

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['browserstack'],
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  browserstackLocal: true,
};
```

## Options

### user
Your Browserstack username.

Type: `String`

### key
Your Browserstack access key.

Type: `String`

### browserstackLocal
Set this to true to enable routing connections from Browserstack cloud through your computer.

Type: `Boolean`<br>
Default: `false`

### browserstackOpts
Specified optional will be passed down to BrowserstackLocal. See [this list](https://www.browserstack.com/local-testing#modifiers) for details.

Type: `Object`<br>
Default: `{}`

## Known Issues

It's more of how webdriverio designed the multi-process model. It is extremely hard if not impossible to reliably transfer localIdentifier to child-processes. We recommend using it without the identifier at this moment, which will create an account-wide local tunnel.
