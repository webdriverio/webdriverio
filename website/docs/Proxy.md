---
id: proxy
title: Proxy Setup
description: "Route requests through a proxy, either between your tests and the driver or between the browser and the internet."
---

You can tunnel two different types of request through a proxy:

- connection between your test script and the browser driver (or WebDriver endpoint)
- connection between the browser and the internet

## Proxy Between Driver And Test

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, you have two options to configure WebdriverIO to use the proxy:

### Option 1: Using Environment Variables (Recommended)

Starting from WebdriverIO v9.12.0, you can simply set the standard proxy environment variables:

```bash
export HTTP_PROXY=http://my.corp.proxy.com:9090
export HTTPS_PROXY=http://my.corp.proxy.com:9090
# Optional: bypass proxy for certain hosts
export NO_PROXY=localhost,127.0.0.1,.internal.domain
```

Then run your tests as usual. WebdriverIO will automatically use these environment variables for proxy configuration.

### Option 2: Using undici's setGlobalDispatcher

For more advanced proxy configurations or if you need programmatic control, you can use undici's `setGlobalDispatcher` method:

#### Install undici

```bash npm2yarn
npm install undici --save-dev
```

#### Add undici setGlobalDispatcher to your config file

Add the following require statement to the top of your config file.

```js title="wdio.conf.js"
import { setGlobalDispatcher, ProxyAgent } from 'undici';

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy || 'http://my.corp.proxy.com:9090').toString() });
setGlobalDispatcher(dispatcher);

export const config = {
    // ...
}
```

Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

### Which Method Should I Use?

- **Use environment variables** if you want a simple, standard approach that works across different tools and doesn't require code changes.
- **Use setGlobalDispatcher** if you need advanced proxy features like custom authentication, different proxy configurations per environment, or want to programmatically control proxy behavior.

Both methods are fully supported and WebdriverIO will check for a global dispatcher first before falling back to environment variables.

### Sauce Connect Proxy

If you use [Sauce Connect Proxy](https://docs.saucelabs.com/secure-connections/sauce-connect-5), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy For Browser And Driver Downloads

WebdriverIO downloads the browser and the driver it needs when they are not installed yet.

- **Geckodriver and Edgedriver** downloads use `HTTPS_PROXY`, `HTTP_PROXY` and `NO_PROXY`. A dispatcher set with `setGlobalDispatcher` wins over these variables.
- **Chrome, Chromium, Firefox and Chromedriver** downloads use `HTTPS_PROXY`, `HTTP_PROXY` and `NO_PROXY` only when one of these is true:
  - the `proxy-agent` package is installed in your project:

    ```bash
    npm install --save-dev proxy-agent
    ```

  - Node.js runs with its built-in proxy support (Node.js 22.21.0 / 24.5.0 or later):

    ```bash
    NODE_USE_ENV_PROXY=1 npx wdio run ./wdio.conf.ts
    ```

  WebdriverIO does not install `proxy-agent` for you, because its dependency tree has security advisories without a fix. When a proxy variable is set and neither option is active, WebdriverIO logs a warning before the first download.

## Proxy Between Browser And Internet

In order to tunnel the connection between the browser and the internet, you can set up a proxy which can be useful to (for example) capture network information and other data with tools like [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

The `proxy` parameters can be applied via the standard capabilities the following way:

```js title="wdio.conf.js"
export const config = {
    // ...
    capabilities: [{
        browserName: 'chrome',
        // ...
        proxy: {
            proxyType: "manual",
            httpProxy: "corporate.proxy:8080",
            socksUsername: "codeceptjs",
            socksPassword: "secret",
            noProxy: "127.0.0.1,localhost"
        },
        // ...
    }],
    // ...
}
```

For more information, see the [WebDriver specification](https://w3c.github.io/webdriver/#proxy).
