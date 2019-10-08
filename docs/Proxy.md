---
id: proxy
title: Proxy Setup
---

You can tunnel two different types of request through a proxy:

- connection between your test script and the browser driver (or WebDriver endpoint)
- connection between the browser and the internet

## Proxy Between Driver And Test

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, you can set it using the `PROXY` environment variable (as explained in the [`request` module](https://github.com/request/request#controlling-proxy-behaviour-using-environment-variables)). 

Before you start the test, make sure you've exported the variable in the terminal, like so:

```sh
export HTTP_PROXY=http://my.corp.proxy.com:9090
export HTTPS_PROXY=https://my.corp.proxy.com:9090
wdio wdio.conf.js
```

Additionally, if you run into errors concerning SSL certificates during test execution, you can set the `STRICT_SSL` environment variable to `false`, which will turn off SSL key validation when making requests over HTTPS:

```sh
export HTTP_PROXY=http://my.corp.proxy.com:9090
export HTTPS_PROXY=https://my.corp.proxy.com:9090
export STRICT_SSL=false
wdio wdio.conf.js
```

If you use [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy Between Browser And Internet

In order to tunnel the connection between the browser and the internet, you can set up a proxy which can be useful to (for example) capture network information and other data with tools like [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy). 

The `proxy` parameters can be applied via the standard capabilities the following way:

```js
// wdio.conf.js

exports.config = {
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
