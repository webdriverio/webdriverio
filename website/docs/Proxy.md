---
id: proxy
title: Proxy Setup
---

You can tunnel two different types of request through a proxy:

- connection between your test script and the browser driver (or WebDriver endpoint)
- connection between the browser and the internet

## Proxy Between Driver And Test

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [undici](https://github.com/nodejs/undici).

### Install undici

```sh
npm install undici --save-dev
```

### Add undici setGlobalDispatcher to your config file

Add the following require statement to the top of your config file.

```js title="wdio.conf.js"
// @ts-check
import { setGlobalDispatcher, ProxyAgent } from 'undici'
import { defineConfig } from '@wdio/config'

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy).toString() })
setGlobalDispatcher(dispatcher)

export const config = defineConfig({
    // ...
})
```

Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

If you use [Sauce Connect Proxy](https://docs.saucelabs.com/secure-connections/sauce-connect-5), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy Between Browser And Internet

In order to tunnel the connection between the browser and the internet, you can set up a proxy which can be useful to (for example) capture network information and other data with tools like [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

The `proxy` parameters can be applied via the standard capabilities the following way:

```js title="wdio.conf.js"
// @ts-check
import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    capabilities: [{
        browserName: 'chrome',
        // ...
        proxy: {
            proxyType: 'manual',
            httpProxy: 'corporate.proxy:8080',
            socksUsername: 'codeceptjs',
            socksPassword: 'secret',
            noProxy: '127.0.0.1,localhost'
        },
        // ...
    }],
    // ...
})
```

For more information, see the [WebDriver specification](https://w3c.github.io/webdriver/#proxy).
