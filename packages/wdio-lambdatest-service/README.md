WebdriverIO LambdaTest Service
========================

> A WebdriverIO service that manages tunnel and job metadata for LambdaTest users.

## Installation


The easiest way is to keep `@wdio/lambdatest-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/lambdatest-service": "^5.0.0"
    }
}
```

You can simple do it by:

```bash
npm install @wdio/lambdatest-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)


## Configuration

WebdriverIO has LambdaTest support out of the box. You should simply set `user` and `key` in your `wdio.conf.js` file. This service plugin provides supports for [LambdaTest Tunnel](https://www.lambdatest.com/support/docs/troubleshooting-lambda-tunnel/). Set `tunnel: true` also to activate this feature.

```js
// wdio.conf.js
export.config = {
    // ...
    user: process.env.LT_USERNAME,
    key: process.env.LT_ACCESS_KEY,
    services: [
        ['lambdatest', {
            tunnel: true
        }]
    ],
    // ...
};
```

## Options

In order to authorize to the LambdaTest service your config needs to contain a [`user`](https://webdriver.io/docs/options.html#user) and [`key`](https://webdriver.io/docs/options.html#key) option.

### tunnel
Set this to true to enable routing connections from LambdaTest cloud through your computer. You will also need to set `tunnel` to true in browser capabilities.

Type: `Boolean`<br>
Default: `false`

### lambdatestOpts
Specified optional will be passed down to LambdaTest Tunnel. See [this list](https://www.lambdatest.com/support/docs/lambda-tunnel-modifiers/) for details.

Type: `Object`<br>
Default: `{}`

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
