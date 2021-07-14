---
id: proxy
title: Proxy Setup
---

Sie können zwei verschiedene Arten von Anfragen über einen Proxy tunneln:

- Verbindungen zwischen Ihrem Testskript und dem Browser-Treiber (oder WebDriver-Server)
- Verbindungen zwischen dem Browser und dem Internet

## Proxy zwischen Treiber und Test

Wenn Ihr Unternehmen einen Proxy für alle ausgehenden Anfragen hat (z.B. auf `http://my.corp.proxy.com:9090`) hat, können Sie dies mit der Umgebungsvariable `PROXY` einstellen, wie [in der Dokumentation](https://github.com/request/request#controlling-proxy-behaviour-using-environment-variables) des "request" Modules erklärt. Bevor Sie den Test starten, stellen Sie sicher, dass Sie die Variable im Terminal wie folgt exportiert haben:

```sh
$ export HTTP_PROXY=http://my.corp.proxy.com:9090
$ export HTTPS_PROXY=https://my.corp.proxy.com:9090
$ wdio wdio.conf.js
```

Wenn Sie [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) verwenden, starten Sie ihn über:

```sh
$ sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy zwischen Browser und Internet

Um die Verbindung zwischen dem Browser und dem Internet zu tunneln, können Sie einen Proxy einrichten, der nützlich sein kann, z.B. um Netzwerkinformationen und andere Daten mit Tools wie [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy) zu erfassen. Die Proxyparameter können über die Standardfunktionen wie folgt angewendet werden:

```js
// wdio.conf.js

exports.config = {
    // ...
    capabilities: [{
        browserName: 'chrome',
        // ...
        proxy: {
            proxyType: "manual",
            httpProxy: "http://corporate.proxy:8080",
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