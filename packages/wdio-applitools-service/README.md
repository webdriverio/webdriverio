WebdriverIO Applitools Service
==============================

> A WebdriverIO service for visual regression testing using Applitools

## Installation

The easiest way is to keep `@wdio/applitools-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/applitools-service": "^6.3.6"
    }
}
```

You can simple do it by:

```bash
npm install @wdio/applitools-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to pass the Applitools API key. This can be set in your `wdio.conf.js` config file or pass `APPLITOOLS_KEY` in your environment so that it can access the Applitools API.

Also make sure that you added `applitools` to your service list, e.g.

```js
// wdio.conf.js
export.config = {
    // ...
    services: [
        ['applitools', {
            key: '<APPLITOOLS_KEY>', // can be passed here or via environment variable `APPLITOOLS_KEY`
            serverUrl: 'https://<org>eyesapi.applitools.com', // optional, can be passed here or via environment variable `APPLITOOLS_SERVER_URL`
            appName: 'myApp',
            // options
            proxy: { // optional
                url: 'http://corporateproxy.com:8080'
                username: 'username', // optional
                password: 'secret', // optional
                isHttpOnly: true // optional
            },
            viewport: { // optional
                width: 1920,
                height: 1080
            }
        }]
    ],
    // ...
};
```

## Usage

Once the service is added you just need to call either the `browser.takeSnapshot` command or the `browser.takeRegionSnapshot` command to compare images within the badge. The `browser.takeRegionSnapshot` command takes two additional parameters: 1) `region` which must be of type `Region|webdriver.WebElement|EyesRemoteWebElement|webdriver.By`, and 2) `frame` of type `webdriver.WebElement|EyesRemoteWebElement|string`; see further details [here](https://applitools.com/docs/api/eyes-sdk/classes-gen/class_target/method-target-region-selenium-javascript.html). The command takes a screenshot name so Applitools can compare it always with the correct image from the baseline, e.g.

```js
describe('My Google Search', () => {
    it('should open the page', () => {
        browser.url('http://google.com')
        browser.takeSnapshot('main page')
    })

    it('should search for something', () => {
        $('#lst-ib').addValue('WebdriverIO ❤️  Applitools')
        browser.keys('Enter')
        browser.takeSnapshot('search')
    })

    it('should open the page and take snapshot of the region with reddit icon in upper left', () => {
        browser.url('https://reddit.com')
        browser.takeRegionSnapshot('Reddit icon; main page', 'css=a._30BbATRhFv3V83DHNDjJAO')
    })
})
```

On the Applitools dashboard you should now find the test with two images:

![Applitools Dashboard](/img/applitools.png "Applitools Dashboard")

## Configuration Properties

### key
Applitools API key to be used. Can be passed via wdio config or via environment variable `APPLITOOLS_KEY`

- Optional
- Type: `string`

### serverUrl
Applitools server URL to be used

- Optional
- Type: `string`
- Default: Public cloud url

### viewport
Viewport with which the screenshots should be taken.

- Optional
- Type: `object`<br>
- Default: `{'width': 1440, 'height': 900}`

### proxy
Use proxy for http/https connections with Applitools.

- Optional
- Type: `object`<br>
- Example:
```js
{
  url: 'http://corporateproxy.com:8080'
  username: 'username' // optional
  password: 'secret' // optional
  isHttpOnly: true // optional
}
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
