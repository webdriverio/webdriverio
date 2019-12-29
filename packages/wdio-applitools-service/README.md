WebdriverIO Applitools Eyes Service
==============================

> A WebdriverIO service for visual regression testing using Applitools

## Installation

The easiest way is to keep `@applitools/eyes-webdriverio5-service` as a devDependency in your `package.json`.

You can simple do it by:

```bash
npm install @applitools/eyes-webdriverio5-service --save-dev
```

And then you'll get something like:

```json
{
  "devDependencies": {
    "@applitools/eyes-webdriverio5-service": "^1.3.0"
  }
}
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to pass the Applitools API key. This can be set in your `wdio.conf.js` config file or pass `APPLITOOLS_API_KEY` in your environment so that it can access the Applitools API.

Also make sure that you added `@applitools/eyes-webdriverio5-service` to your service list, e.g.

```js
// wdio.conf.js

export.config = {
  // ...
  services: ['@applitools/eyes-webdriverio5-service'],
  eyes: {
    // specific configuration for Applitools' eyes service here
  }
  // ...
};
```

## Usage

Once the service is added you just need to call either the `browser.eyesCheck` command to compare images within the badge.

The command takes a screenshot and makes Applitools compare it with the image from the baseline, e.g.

The `browser.eyesCheck` command takes two optional parameters:
1) `title` which must be of type `string`.
2) `checkSettings` - controls what part of the page to capture, as well as meta configuration for comparison. Common settings are:
    - `Target.window().fully()` - full page screenshot (default).
    - `Target.window()` - screenshot of the viewport.
    - `Target.region(region)` - screenshot of an area in the page. `region` can be of type `Region|webdriver.WebElement|EyesRemoteWebElement|webdriver.By`.
    - `Target.frame(frame)` - screenshot of a frame. `frame` can be of type `Region|webdriver.WebElement|EyesRemoteWebElement|webdriver.By`.

For more information, see the Applitools documentation [here](https://applitools.com/docs/api/eyes-sdk/index-gen/class-target-selenium-javascript.html).

For example:

```js
const {Target} = require('@applitools/eyes-webdriverio')

describe('My Google Search', () => {
    it('should open the page', () => {
        browser.url('http://google.com')
        browser.eyesCheck('main page')
    })

    it('should search for something', () => {
        $('#lst-ib').addValue('WebdriverIO ❤️  Applitools')
        browser.keys('Enter')
        browser.eyesCheck('search')
    })

    it('should open the page and take snapshot of the region with reddit icon in upper left', () => {
        browser.url('https://reddit.com')
        browser.eyesCheck('Reddit icon; main page', Target.region('css=a._30BbATRhFv3V83DHNDjJAO'))
    })
})
```

On the Applitools dashboard you should now find the test with two images:

![Applitools Dashboard](/img/applitools.png "Applitools Dashboard")

## Config properties

The `eyes` section in the config file is passed as-is and serves as a configuration for Applitools' `eyesCheck` command. The full list can be seen in the Applitools docs [here](https://applitools.com/docs/api/eyes-sdk/index-gen/class-configuration-webdriverio_sdk5-javascript.html).

For example:

```js
// wdio.conf.js

exports.config = {
    eyes: {
        apiKey: '<APPLITOOLS_API_KEY>', // can be passed here or via environment variable `APPLITOOLS_API_KEY`
        serverUrl: 'https://<org>eyesapi.applitools.com', // optional, can be passed here or via environment variable `APPLITOOLS_SERVER_URL`
        // options
        proxy: { // optional
            url: 'http://corporateproxy.com:8080'
            username: 'username' // optional
            password: 'secret' // optional
            isHttpOnly: true // optional
        }
        viewport: { // optional
            width: 1920,
            height: 1080
        }
    }
}
```
