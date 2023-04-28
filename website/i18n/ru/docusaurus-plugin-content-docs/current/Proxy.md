---
id: proxy
title: Настройка прокси
---

Через прокси-сервер можно соединить два различных типа запросов:

- Соединение между вашим тестами и драйвером браузера (или конечной точкой WebDriver)
- Соединение между браузером и интернетом

## Прокси между драйвером и тестами

Если у вашей компании есть корпоративный прокси-сервер (например, на `http://my.corp.proxy.com:9090`) для всех исходящих запросов, выполните следующие шаги, чтобы установить и настроить [global-agent](https://github.com/gajus/global-agent).

### Установка global-agent

```bash npm2yarn
npm install global-agent --save-dev
```

### Добавьте global-agent в bootstrap в файл вашей конфигурации

Добавьте следующую инструкцию в начало вашего конфигурационного файла.

```js title="wdio.conf.js"
import { bootstrap } from 'global-agent';
bootstrap();

export const config = {
    // ...
}
```

### Установить переменные среды для global-agent

Прежде чем начать тест, убедитесь, что вы экспортировали переменную в терминал, например:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
wdio wdio.conf.js
```

Вы можете исключить URL-адреса из прокси-сервера, экспортировав переменную, например:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_NO_PROXY='.foo.com'
wdio wdio.conf.js
```

При необходимости вы можете указать `GLOBAL_AGENT_HTTPS_PROXY` для маршрутизации HTTPS-трафика через прокси-сервер, отличный от HTTP-трафика.

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_HTTPS_PROXY=http://my.corp.proxy.com:9091
wdio wdio.conf.js
```

`GLOBAL_AGENT_HTTP_PROXY` используется как для запросов HTTP, так и для HTTPS, если `GLOBAL_AGENT_HTTPS_PROXY` не установлен.

Если вы используете [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy), запустите его через:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Прокси между браузером и интернетом

Для того чтобы создать туннель между браузером и интернетом вы можете настроить прокси, который может быть полезен (например, для захвата сетевой информации и других данных с помощью таких инструментов, как [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

Параметр ` proxy ` можно применить через стандартные возможности следующим образом:

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
