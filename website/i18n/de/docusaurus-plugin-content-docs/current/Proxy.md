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

``` reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-driver-and-test.js
```

Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

If you use [Sauce Connect Proxy](https://docs.saucelabs.com/secure-connections/sauce-connect-5), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy zwischen Browser und Internet

Um die Verbindung zwischen dem Browser und dem Internet zu tunneln, können Sie einen Proxy einrichten, der nützlich sein kann, um (zum Beispiel) Netzwerkinformationen und andere Daten mit Tools wie [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy)zu erfassen.

Die `Proxy-` Parameter können wie folgt über die Standardfunktionen angewendet werden:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-browser-and-internet.js
```

Weitere Informationen finden Sie in der [WebDriver-Spezifikation](https://w3c.github.io/webdriver/#proxy).
