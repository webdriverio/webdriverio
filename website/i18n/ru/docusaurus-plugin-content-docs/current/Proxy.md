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

``` reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-driver-and-test.js
```

Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

If you use [Sauce Connect Proxy](https://docs.saucelabs.com/secure-connections/sauce-connect-5), start it via:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Прокси между браузером и интернетом

Для того чтобы создать туннель между браузером и интернетом вы можете настроить прокси, который может быть полезен (например, для захвата сетевой информации и других данных с помощью таких инструментов, как [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

Параметр `proxy` можно применить через стандартные возможности следующим образом:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/proxying/proxy-between-browser-and-internet.js
```

Для получения дополнительной информации см. спецификацию [WebDriver](https://w3c.github.io/webdriver/#proxy).
