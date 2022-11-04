---
id: docker
title: Docker
---

Docker is a powerful containerization technology that allows to encapsulate your test suite into a container that behaves the same on every system. This can avoid flakiness due to different browser or platform versions. In order to run your tests within a container, create a `Dockerfile` in your project directory, e.g.:

```Dockerfile
FROM ianwalter/puppeteer:latest
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
We are using a Docker image here that comes with Google Chrome pre-installed. There various of images available with different browser setups. Check out the images maintained by the Selenium project [on Docker Hub](https://hub.docker.com/u/selenium).
:::

As we can only run Google Chrome in headless mode in our Docker container we have to modify our `wdio.conf.js` to ensure we do that:

```js title="wdio.conf.js"
export const config = {
    // ...
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        acceptInsecureCerts: true,
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

As mentioned in [Automation Protocols](/docs/automationProtocols) you can run WebdriverIO using the WebDriver protocol or Chrome DevTools. If you use WebDriver make sure that the Chrome version installed on your image matches the [Chromedriver](https://www.npmjs.com/package/chromedriver) version you have defined in your `package.json`.

To build the Docker container you can run:

```sh
docker build -t mytest -f Dockerfile .
```

Then to run the tests, execute:

```sh
docker run -it mytest
```

For more information on how to configure the Docker image, check out the [Docker docs](https://docs.docker.com/).
