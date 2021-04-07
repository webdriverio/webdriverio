---
id: proxy
title: Ustawienia serwera proxy
---

Możesz tunelować dwa różne typy żądań przez proxy:

- połączenie między twoim skryptem testowym a sterownikiem przeglądarki (lub punktem końcowym WebDriver)
- połączenie między przeglądarką a internetem

## Proxy między sterownikiem a testem

Jeśli Twoja firma ma proxy korporacyjne (np. `http://my.corp.proxy.com:9090`) dla wszystkich wychodzących żądań możesz ustawić je za pomocą zmiennej środowiskowej `PROXY`, jak wyjaśniono w [Moduł Request](https://github.com/request/request#controlling-proxy-behaviour-using-environment-variables). Zanim rozpoczniesz test upewnij się, że zmienna jest wyeksportowana w terminalu w następujący sposób:

```sh
$ export HTTP_PROXY=http://my.corp.proxy.com:9090
$ export HTTPS_PROXY=https://my.corp.proxy.com:9090
$ wdio wdio.conf.js
```

Jeśli używasz [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) uruchom go poprzez:

```sh
$ sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy między przeglądarką a Internetem

W celu tunelowania połączenia pomiędzy przeglądarką a internetem możesz skonfigurować proxy, które może być przydatne np. do przechwytywania informacji sieciowych oraz innych danych za pomocą narzędzi takich jak [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy). Parametry proxy mogą być stosowane za pomocą standardowych funkcji w następujący sposób:

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

Aby uzyskać więcej informacji zobacz [specyfikację WebDriver](https://w3c.github.io/webdriver/#proxy).