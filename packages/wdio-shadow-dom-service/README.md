WebdriverIO Shadow DOM Service
==============================

> A WebdriverIO service for easy access to shadow DOM elements

## Installation

The easiest way is to keep `@wdio/shadow-dom-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/shadow-dom-service": "^5.0.0"
  }
}
```

Install it with npm:

```bash
npm install @wdio/shadow-dom-service --save-dev
```

or yarn:

```bash
yarn add @wdio/shadow-dom-service --dev
```


Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to include it in your config.js `services` array, e.g.

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['shadow-dom']
};
```

## Usage

Once the service is added, you'll have access to the shadow$ and shadow$$ element commands in your tests.

```js
describe('My Google Search', () => {
    it('should query shadow DOM for an element', () => {
        browser.url('http://google.com')
        // interact with a `custom-button` element that's inside `some-custom-element`'s shadow DOM
        $('some-custom-element').shadow$('custom-button').click()
    })

    it('should query shadow DOM for multiple elements', () => {
        browser.url('http://google.com')
        // interact with a list of `list-item` element's that are inside `some-custom-element`'s shadow DOM
        $('some-custom-element').shadow$$('list-item').click()
    })
})
```

In order to keep your tests compatible with browsers that don't support shadow DOM yet (or are using shady DOM polyfills), the `shadow$` and `shadow$$` commands will fall back to querying light DOM if a shadowRoot property is not found.

## Options
There are no configurable options at this time
