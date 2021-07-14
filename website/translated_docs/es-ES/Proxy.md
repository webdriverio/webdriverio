---
id: proxy
title: Configuración de proxy
---

Puede túnel de dos tipos diferentes de solicitud a través de un proxy:

- conexión entre el script de prueba y el controlador del navegador (o el punto final de WebDriver)
- conexión entre el navegador y el internet

## Proxy entre controlador y prueba

Si su empresa tiene un proxy corporativo (por ejemplo, en `http://my.corp.proxy.com:9090`) para todas las peticiones salientes que puede configurar usando la variable de entorno `PROXY` tal y como se explica en el [módulo de solicitud](https://github.com/request/request#controlling-proxy-behaviour-using-environment-variables). Antes de iniciar la prueba, asegúrese de exportar la variable en la terminal de la siguiente manera:

```sh
$ export HTTP_PROXY=http://my.corp.proxy.com:9090
$ export HTTPS_PROXY=https://my.corp.proxy.com:9090
$ wdio wdio.conf.js
```

Si usas [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) lo inicia a través de:

```sh
$ sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy entre el navegador y el Internet

Para túnel de la conexión entre el navegador y el Internet, puede configurar un proxy que puede ser útil por ejemplo, para capturar información de red y otros datos usando herramientas como [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy). Los parámetros de proxy se pueden aplicar a través de las capacidades estándar de la siguiente manera:

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

Para más información, vea la [especificación de WebDriver](https://w3c.github.io/webdriver/#proxy).