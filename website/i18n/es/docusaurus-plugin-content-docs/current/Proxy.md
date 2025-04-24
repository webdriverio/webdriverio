---
id: proxy
title: Configuración del proxy
---

Puede canalizar dos tipos diferentes de solicitud a través de un proxy:

- conexión entre su script de prueba y el controlador del navegador (o el punto final WebDriver)
- conexión entre el navegador e internet

## Proxy entre controlador y prueba

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [undici](https://github.com/nodejs/undici).

### Install undici

```bash npm2yarn
npm install undici --save-dev
```

### Add undici setGlobalDispatcher to your config file

Añada la siguiente instrucción requerir al principio de su archivo de configuración.

``` reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-driver-and-test.js
```

Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

If you use [Sauce Connect Proxy](https://docs.saucelabs.com/secure-connections/sauce-connect-5), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy entre el navegador e Internet

Para canalizar la conexión entre el navegador e Internet, puede configurar un proxy que puede ser útil (por ejemplo) para capturar información de la red y otros datos con herramientas como [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

Los parámetros del proxy `` se pueden aplicar a través de las capacidades estándar de la siguiente manera:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-browser-and-internet.js
```

Para obtener más información, consulte la [especificación de WebDriver](https://w3c.github.io/webdriver/#proxy).
