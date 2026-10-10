---
id: docker
title: Docker
description: "Run your WebdriverIO test suite inside a Docker container with a preinstalled browser for consistent results across machines."
---

Docker is a powerful containerization technology that allows to encapsulate your test suite into a container that behaves the same on every system. This can avoid flakiness due to different browser or platform versions. In order to run your tests within a container, create a `Dockerfile` in your project directory, e.g.:

```Dockerfile
FROM selenium/standalone-chrome:134.0-20250323 # Change the browser and version according to your needs
WORKDIR /app
ADD . /app

RUN npm install

CMD npx wdio
```

Make sure you don't include your `node_modules` in your Docker image and have these installed when building the image. For that add a `.dockerignore` file with the following content:

```
node_modules
```

:::info
We are using a Docker image here that comes with Selenium and Google Chrome pre-installed. There are various images available with different browser setups and browser versions. Check out the images maintained by the Selenium project [on Docker Hub](https://hub.docker.com/u/selenium).
:::

As we can only run Google Chrome in headless mode in our Docker container we have to modify our `wdio.conf.js` to ensure we do that:

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

To build the Docker container you can run:

```sh
docker build -t mytest -f Dockerfile .
```

Then to run the tests, execute:

```sh
docker run -it mytest
```

For more information on how to configure the Docker image, check out the [Docker docs](https://docs.docker.com/).

## Images where WebdriverIO downloads the browser

When the image has no browser, WebdriverIO downloads Chrome, Chromium, Firefox and Chromedriver itself. Chrome, Chromium and Chromedriver come as zip files, and WebdriverIO extracts them with the `unzip` command on Linux and macOS (`tar.exe` or PowerShell on Windows). Slim images, such as `node:24-slim`, and minimal Alpine images do not have `unzip`, so install it in your `Dockerfile`:

```Dockerfile
FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
```

On Alpine, use `RUN apk add --no-cache unzip`. Without it, the download fails with `Extraction failed: no zip archiver is available`.
