---
id: docker
title: Docker
---

Docker ist eine leistungsstarke Containerisierungstechnologie, mit der Sie Ihre Testsuite in einen Container verpacken können, der sich auf jedem System gleich verhält. Dies kann Unregelmäßigkeiten durch verschieden Browser oder Systeme verhindern. Um Ihre Tests innerhalb eines Containers auszuführen, erstellen Sie ein `Dockerfile` in Ihrem Projektverzeichnis, z.B.:

```Dockerfile
FROM ianwalter/puppeteer:latest
WORKDIR /app
ADD . /app

RUN npm install

CMD npx wdio
```

Stellen Sie sicher, dass Sie Ihr `node_modules` Ordner nicht in Ihr Docker-Image einschließen und die Dependencies beim Erstellen des Images installieren. Fügen Sie dazu eine `.dockerignore` -Datei mit folgendem Inhalt hinzu:

```
node_modules
```

:::info
Wir verwenden hier ein Docker-Image, auf dem Google Chrome vorinstalliert ist. Es gibt verschiedene Images, die mit verschiedenen Browser-Setups verfügbar sind. Finden Sie dies im Selenium-Projekt [auf Docker Hub](https://hub.docker.com/u/selenium).
:::

Da wir Google Chrome in unserem Docker-Container nur im Headless-Modus ausführen können, müssen wir unsere `wdio.conf.js` ändern, um dies sicherzustellen:

```js title="wdio.conf.js"
export const config = {
    // ...
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-infobars',
                '--headless',
                '--disable-gpu',
                '--window-size=1440,735'
            ],
        }
    }],
    // ...
}
```

Wie in [Automatisierungsprotokolle](/docs/automationProtocols) erwähnt, können Sie WebdriverIO mit dem WebDriver-Protokoll oder Chrome DevTools ausführen. Wenn Sie WebDriver verwenden, stellen Sie sicher, dass die auf Ihrem Image installierte Chrome-Version mit der [Chromedriver](https://www.npmjs.com/package/chromedriver) -Version übereinstimmt, die Sie in Ihrer `package.json` definiert haben.

Um den Docker-Container zu erstellen, können Sie Folgendes ausführen:

```sh
docker build -t mytest -f Dockerfile .
```

Führen Sie dann zum Ausführen der Tests Folgendes aus:

```sh
docker run -it mytest
```

Weitere Informationen zum Konfigurieren des Docker-Images finden Sie in der [Docker-Dokumentation](https://docs.docker.com/).
