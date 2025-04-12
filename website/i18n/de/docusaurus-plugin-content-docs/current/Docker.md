---
id: docker
title: Docker
---

Docker ist eine leistungsstarke Containerisierungstechnologie, mit der Sie Ihre Testsuite in einen Container verpacken können, der sich auf jedem System gleich verhält. Dies kann Unregelmäßigkeiten durch verschieden Browser oder Systeme verhindern. Um Ihre Tests innerhalb eines Containers auszuführen, erstellen Sie ein `Dockerfile` in Ihrem Projektverzeichnis, z.B.:

```Dockerfile
FROM selenium/standalone-chrome:134.0-20250323 # Change the browser and version according to your needs
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
We are using a Docker image here that comes with Selenium and Google Chrome pre-installed. There are various of images available with different browser setups and browser versions. Finden Sie dies im Selenium-Projekt [auf Docker Hub](https://hub.docker.com/u/selenium).
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

As mentioned in [Automation Protocols](/docs/automationProtocols) you can run WebdriverIO using the WebDriver protocol or WebDriver BiDi protocol. Make sure that the Chrome version installed on your image matches the [Chromedriver](https://www.npmjs.com/package/chromedriver) version you have defined in your `package.json`.

Um den Docker-Container zu erstellen, können Sie Folgendes ausführen:

```sh
docker build -t mytest -f Dockerfile .
```

Führen Sie dann zum Ausführen der Tests Folgendes aus:

```sh
docker run -it mytest
```

Weitere Informationen zum Konfigurieren des Docker-Images finden Sie in der [Docker-Dokumentation](https://docs.docker.com/).
