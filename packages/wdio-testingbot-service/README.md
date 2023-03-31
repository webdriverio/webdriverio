WebdriverIO TestingBot Service
==============================

> WebdriverIO service that provides a better integration into TestingBot. It updates the job metadata ('name', 'passed', 'tags', 'public', 'build', 'extra') and runs TestingBot Tunnel if desired.

## Installation

The easiest way is to keep `@wdio/testingbot-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/testingbot-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

In order to use the service you need to set `user` and `key` in your `wdio.conf.js` file, and set the `hostname` option to `hub.testingbot.com`. If you want to use [TestingBot Tunnel](https://testingbot.com/support/other/tunnel)
you need to set `tbTunnel: true`.

```js
// wdio.conf.js
export const config = {
    // ...
    user: process.env.TB_KEY,
    key: process.env.TB_SECRET,
    services: [
        ['testingbot', {
            tbTunnel: true
        }]
    ],
    // ...
};
```

## Options

To authorize the TestingBot service your config needs to contain a [`user`](https://webdriver.io/docs/options#user) and [`key`](https://webdriver.io/docs/options#key) option.

### tbTunnel
If true it runs the TestingBot Tunnel and opens a secure connection between a TestingBot Virtual Machine running your browser tests.

Type: `Boolean`<br />
Default: `false`

### tbTunnelOpts
Apply TestingBot Tunnel options (e.g. to change port number or logFile settings). See [this list](https://github.com/testingbot/testingbot-tunnel-launcher) for more information.

Type: `Object`<br />
Default: `{}`
