WebdriverIO TestingBot Service
==============================

> WebdriverIO service that provides a better integration into TestingBot. It updates the job metadata ('name', 'passed', 'tags', 'public', 'build', 'extra') and runs TestingBot Tunnel if desired.

## Installation

The easiest way is to keep `@wdio/testingbot-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/testingbot-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/testingbot-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to set `user` and `key` in your `wdio.conf.js` file, and set the `host` option to `hub.testingbot.com`. If you want to use [TestingBot Tunnel](https://testingbot.com/support/other/tunnel)
you just need to set `tbTunnel: true`.

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['testingbot'],
  user: process.env.TB_KEY,
  key: process.env.TB_SECRET,
  tbTunnel: true,
  // ...
};
```

## Options

### user
Your TestingBot API KEY.

Type: `String`

### key
Your TestingBot API SECRET.

Type: `String`

### tbTunnel
If true it runs the TestingBot Tunnel and opens a secure connection between a TestingBot Virtual Machine running your browser tests.

Type: `Boolean`<br>
Default: `false`

### tbTunnelOpts
Apply TestingBot Tunnel options (e.g. to change port number or logFile settings). See [this list](https://github.com/testingbot/testingbot-tunnel-launcher) for more information.

Type: `Object`<br>
Default: `{}`
