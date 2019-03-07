WebdriverIO Applitools Service
==============================

> A WebdriverIO service for visual regression testing using Applitools

## Installation

The easiest way is to keep `@wdio/applitools-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/applitools-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/applitools-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to pass `applitoolsKey`. This can be set in your `wdio.conf.js` config file or pass `APPLITOOLS_KEY` in your environment so that it can access the Applitools API. 

Also make sure that you added `applitools` to your service list, e.g.

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['applitools'],
  applitoolsKey: 'APPLITOOLS_KEY', // can be passed here or via environment
  applitoolsServerUrl: 'APPLITOOLS_Server_URL', // optional
  applitools: {
    // options
    // ...
  }
  // ...
};
```

## Usage

Once the service is added you just need to call the `browser.takeSnapshot` command to compare images within the badge. The command takes a screenshot name so Applitools can compare it always with the correct image from the baseline, e.g.

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
})
```

On the Applitools dashboard you should now find the test with two images:

![Applitools Dashboard](/img/applitools.png "Applitools Dashboard")

## Options

### viewport
Viewport with which the screenshots should be taken.

Type: `Object`<br>
Default: `{'width': 1440, 'height': 900}`
