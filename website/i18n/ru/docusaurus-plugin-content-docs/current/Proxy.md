---
id: proxy
title: Настройка прокси
---

Через прокси-сервер можно соединить два различных типа запросов:

- Соединение между вашим тестами и драйвером браузера (или конечной точкой WebDriver)
- Соединение между браузером и интернетом

## Прокси между драйвером и тестами

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [undici](https://github.com/nodejs/undici).

### Install undici

```bash npm2yarn
npm install undici --save-dev
```

### Add undici setGlobalDispatcher to your config file

Добавьте следующую инструкцию в начало вашего конфигурационного файла.

```js title="wdio.conf.js"
import { setGlobalDispatcher, ProxyAgent } from 'undici';

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy).toString() });
setGlobalDispatcher(dispatcher);

export const config = {
    // ...
}
```
Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/api/ProxyAgent.md).

Если вы используете [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy), запустите его через:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Прокси между браузером и интернетом

Для того чтобы создать туннель между браузером и интернетом вы можете настроить прокси, который может быть полезен (например, для захвата сетевой информации и других данных с помощью таких инструментов, как [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

Параметр `proxy` можно применить через стандартные возможности следующим образом:

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

Для получения дополнительной информации см. спецификацию [WebDriver](https://w3c.github.io/webdriver/#proxy).
