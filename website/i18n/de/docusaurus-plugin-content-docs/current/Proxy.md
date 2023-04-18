---
id: proxy
title: Proxy-Setup
---

Sie können zwei verschiedene Arten von Anfragen durch einen Proxy tunneln:

- Verbindung zwischen Ihrem Testskript und dem Browsertreiber (oder WebDriver-Endpunkt)
- Verbindung zwischen Browser und Internet

## Proxy zwischen Treiber und Test

Wenn Ihr Unternehmen über einen Unternehmens-Proxy (z. B. auf `http://my.corp.proxy.com:9090`) für alle ausgehenden Anfragen verfügt, führen Sie die folgenden Schritte aus, um [global-agent](https://github.com/gajus/global-agent)zu installieren und zu konfigurieren.

### Global-Agent installieren

```bash npm2yarn
npm install global-agent --save-dev
```

### Fügen Sie Ihrer Konfigurationsdatei global-agent bootstrap hinzu

Fügen Sie die folgende require-Anweisung am Anfang Ihrer Konfigurationsdatei hinzu.

```js title="wdio.conf.js"
import { bootstrap } from 'global-agent';
bootstrap();

export const config = {
    // ...
}
}
}
```

### Legen Sie die Umgebungsvariablen des globalen Agenten fest

Bevor Sie den Test starten, vergewissern Sie sich, dass Sie die Variable wie folgt in das Terminal exportiert haben:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
wdio wdio.conf.js
```

Sie können URLs vom Proxy ausschließen, indem Sie die Variable wie folgt exportieren:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_NO_PROXY='.foo.com'
wdio wdio.conf.js
```

Bei Bedarf können Sie `GLOBAL_AGENT_HTTPS_PROXY` angeben, um HTTPS-Datenverkehr über einen anderen Proxy als HTTP-Datenverkehr zu leiten.

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_HTTPS_PROXY=http://my.corp.proxy.com:9091
wdio wdio.conf.js
```

`GLOBAL_AGENT_HTTP_PROXY` wird sowohl für HTTP- als auch für HTTPS-Anforderungen verwendet, wenn `GLOBAL_AGENT_HTTPS_PROXY` nicht festgelegt ist.

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
