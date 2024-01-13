---
id: proxy
title: Proxy Setup
---

You can tunnel two different types of request through a proxy:

- connection between your test script and the browser driver (or WebDriver endpoint)
- connection between the browser and the internet

## Proxy Between Driver And Test

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [global-agent](https://github.com/gajus/global-agent).

### Install global-agent

```bash npm2yarn
npm install global-agent --save-dev
```

### Add global-agent bootstrap to your config file

Add the following require statement to the top of your config file.

```js title="wdio.conf.js"
import { bootstrap } from 'global-agent';
bootstrap();

export const config = {
    // ...
}
```

### Set global-agent environment variables

Before you start the test, make sure you've exported the variable in the terminal, like so:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
wdio wdio.conf.js
```

You can exclude URLs from the proxy by exporting the variable, like so:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_NO_PROXY='.foo.com'
wdio wdio.conf.js
```

If necessary, you can specify `GLOBAL_AGENT_HTTPS_PROXY` to route HTTPS traffic through a different proxy than HTTP traffic.

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_HTTPS_PROXY=http://my.corp.proxy.com:9091
wdio wdio.conf.js
```

`GLOBAL_AGENT_HTTP_PROXY` is used for both HTTP and HTTPS requests if `GLOBAL_AGENT_HTTPS_PROXY` is not set.

If you use [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

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
