---
id: proxy
title: Configuración del proxy
---

Puede canalizar dos tipos diferentes de solicitud a través de un proxy:

- conexión entre su script de prueba y el controlador del navegador (o el punto final WebDriver)
- conexión entre el navegador e internet

## Proxy entre controlador y prueba

Si su empresa tiene un proxy corporativo (por ejemplo, en `http://my.corp.proxy. om:9090`) para todas las solicitudes salientes, siga los siguientes pasos para instalar y configurar [global-agent](https://github.com/gajus/global-agent).

### Instalar agente global

```bash npm2yarn
npm install global-agent --save-dev
```

### Añadir arranque global-agente a su archivo de configuración

Añada la siguiente instrucción requerir al principio de su archivo de configuración.

```js title="wdio.conf.js"
import { bootstrap } from 'global-agent';
bootstrap();

export const config = {
    // ...
}
```

### Establecer variables de entorno de agentes globales

Antes de iniciar la prueba, asegúrese de que ha exportado la variable en la terminal, así:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
wdio wdio.conf.js
```

Puede excluir URLs del proxy exportando la variable, así:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_NO_PROXY='.foo.com'
wdio wdio.conf.js
```

Si es necesario, puede especificar `GLOBAL_AGENT_HTTPS_PROXY` para enrutar el tráfico HTTPS a través de un proxy diferente al tráfico HTTP.

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_HTTPS_PROXY=http://my.corp.proxy.com:9091
wdio wdio.conf.js
```

`GLOBAL_AGENT_HTTP_PROXY` se utiliza para solicitudes HTTP y HTTPS si `GLOBAL_AGENT_HTTPS_PROXY` no está establecido.

Si utiliza [Sauce Connect Proxy](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy), inicia a través de:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## Proxy entre el navegador e Internet

Para canalizar la conexión entre el navegador e Internet, puede configurar un proxy que puede ser útil (por ejemplo) para capturar información de la red y otros datos con herramientas como [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy).

Los parámetros del proxy `` se pueden aplicar a través de las capacidades estándar de la siguiente manera:

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

Para obtener más información, consulte la [especificación de WebDriver](https://w3c.github.io/webdriver/#proxy).
