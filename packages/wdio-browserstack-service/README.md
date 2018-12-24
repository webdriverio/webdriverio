WebdriverIO Browserstack Service
==========

> A WebdriverIO service that manages local tunnel and job metadata for Browserstack users.

## Installation


The easiest way is to keep `@wdio/browserstack-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/browserstack-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/browserstack-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)


## Configuration

WebdriverIO has Browserstack support out of the box. You should simply set `user` and `key` in your `wdio.conf.js` file. This service plugin provides supports for [Browserstack Tunnel](https://www.browserstack.com/automate/node#setting-local-tunnel). Set `browserstackLocal: true` also to activate this feature.

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
Set this to true to enable routing connections from Browserstack cloud through your computer. You will also need to set `browserstack.local` to true in browser capabilities.

Type: `Boolean`<br>
Default: `false`

### browserstackLocalForcedStop
Set this to true to kill the browserstack process on complete, without waiting for the browserstack stop callback to be called. This is experimental and should not be used by all. Mostly necessary as a workaraound for [this issue](https://github.com/browserstack/browserstack-local-nodejs/issues/41).

Type: `Boolean`<br>
Default: `false`

### browserstackOpts
Specified optional will be passed down to BrowserstackLocal. See [this list](https://www.browserstack.com/local-testing#modifiers) for details.

Type: `Object`<br>
Default: `{}`

----

# Known Issues

- It's more of how webdriverio desigend the multi-process model. It is extremely hard if not impossible to reliable transfer localIdentifier to child-processes. We recommend to use it without the identifier at this moment, which will create an account-wide local tunnel.

# Credits

- [wdio-sauce-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service)
- [browserstack-local](https://github.com/browserstack/browserstack-local-nodejs)
- ... and all other dependencies

For more information on WebdriverIO see the [homepage](https://webdriver.io).

# Sponsors

Thanks for [Browserstack](https://browserstack.com/) to provide us with a free account for automated tests.
