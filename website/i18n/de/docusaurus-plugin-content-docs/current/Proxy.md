---
id: proxy
title: Proxy-Setup
---

Sie können zwei verschiedene Arten von Anfragen durch einen Proxy tunneln:

- Verbindung zwischen Ihrem Testskript und dem Browsertreiber (oder WebDriver-Endpunkt)
- Verbindung zwischen Browser und Internet

## Proxy zwischen Treiber und Test

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [undici](https://github.com/nodejs/undici).

### Install undici

```bash npm2yarn
npm install undici --save-dev
```

### Add undici setGlobalDispatcher to your config file

Fügen Sie die folgende require-Anweisung am Anfang Ihrer Konfigurationsdatei hinzu.

```js title="wdio.conf.js"
import { setGlobalDispatcher, ProxyAgent } from 'undici';

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy).toString() });
setGlobalDispatcher(dispatcher);

export const config = {
    // ...
}
```
Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/api/ProxyAgent.md).

Wenn Sie [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)verwenden, starten Sie ihn über:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy zwischen Browser und Internet

Um die Verbindung zwischen dem Browser und dem Internet zu tunneln, können Sie einen Proxy einrichten, der nützlich sein kann, um (zum Beispiel) Netzwerkinformationen und andere Daten mit Tools wie [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy)zu erfassen.

Die `Proxy-` Parameter können wie folgt über die Standardfunktionen angewendet werden:

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

Weitere Informationen finden Sie in der [WebDriver-Spezifikation](https://w3c.github.io/webdriver/#proxy).
