WebdriverIO CrossBrowserTesting Service
==========

> A WebdriverIO service that manages local tunnel and job metadata for CrossBrowserTesting users.

## Installation

The easiest way is to keep `@wdio/crossbrowsertesting-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/crossbrowsertesting-service": "^6.1.14"
    }
}
```


Or simply run:

```bash
npm install  @wdio/crossbrowsertesting-service --save-dev
```


Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to set `user` and `key` in your `wdio.conf.js` file, and set the `host` option to `hub.crossbrowsertesting.com`. If you want to use [CrossBrowserTesting Tunnel](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/)
you just need to set `cbtTunnel: true`.

```js
// wdio.conf.js
export.config = {
    // ...
    user: process.env.CBT_USERNAME,
    key: process.env.CBT_AUTHKEY,
    services: [
        ['crossbrowsertesting', {
            cbtTunnel: true,
            cbtTunnelOpts: {
                // any additional options from cbt_tunnels
            },
        }]
    ],
    // ...
};
```

## Options

In order to authorize to the CrossBrowserTesting service your config needs to contain a [`user`](https://webdriver.io/docs/options.html#user) and [`key`](https://webdriver.io/docs/options.html#key) option.

### cbtTunnel
If true secure CBT local connection is started.

Type: `Boolean`<br>
Default: `false`

### cbtTunnelOpts
Any additional options to pass along to the `start()` function of [cbt_tunnels](https://www.npmjs.com/package/cbt_tunnels)

Type: `Object`<br>
Default: `{}`

---

For more information on WebdriverIO see the [homepage](http://webdriver.io).
