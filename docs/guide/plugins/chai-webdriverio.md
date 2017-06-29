name: chai-webdriverio
category: plugins
tags: guide
index: 3
title: Chai-WebdriverIO
---
# chai-webdriverio


Provides [webdriverio](https://npmjs.org/package/webdriverio) sugar for the [Chai](http://chaijs.com/) assertion library. Allows you to create expressive integration tests:

```javascript
expect('.frequency-field').to.have.text('One time')
expect('.toggle-pane').to.not.be.visible()
```

## What sorts of assertions can we make?

All assertions start with a [WebdriverIO-compatible selector](http://webdriver.io/guide/usage/selectors.html), for example:

- `expect('.list')` (CSS selector)
- `expect('a[href=http://google.com]')` (CSS Selector)
- `expect('//BODY/DIV[6]/DIV[1]')` (XPath selector)
- `expect('a*=Save')` (Text selector)

Then, we can add our assertion to the chain.

- `expect(selector).to.be.there()` - Test whether the element exists.
- `expect(selector).to.be.visible()` - Test whether or not the element is visible.
- `expect(selector).to.have.text('string')` - Test the text value of the dom element against supplied string. Exact matches only.
- `expect(selector).to.have.text(/regex/)` - Test the text value of the dom element against the supplied regular expression.
- `expect(selector).to.have.count(number)` - Test how many elements exist in the dom with the supplied selector

You can also always add a `not` in there to negate the assertion:

- `expect(selector).not.to.have.text('property')`

## Setup

Setup is pretty easy. Just:

```javascript
var chai = require('chai');
var chaiWebdriver = require('chai-webdriverio').default;
chai.use(chaiWebdriver(browser));

// And you're good to go!
browser.url('http://github.com');
chai.expect('#site-container h1.heading').to.not.contain.text("I'm a kitty!");
```

## Contributing

so easy.

```bash
npm                # download the necessary development dependencies
npm transpile      # compile ES6 into javascript
npm test           # build and run the specs
```

**Contributors:**

* [@mltsy](https://github.com/mltsy) : `exist`, `text` assertions, documentation & test adjustments

## License

Apache 2.0

## Thanks
Thanks to [goodeggs](https://github.com/goodeggs/) for creating: [chai-webdriver](https://github.com/goodeggs/chai-webdriver) which inspired this module.
