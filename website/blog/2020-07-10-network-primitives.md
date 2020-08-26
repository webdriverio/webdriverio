---
title: New Network Primitives (Beta)
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

The WebdriverIO team continues its efforts to provide more functionality to its automation interface by shipping new network primitives to its API. With the latest `v6.3`. update you can now easily mock web resources in your test and define custom responses that allow you to drastically reduce testing time as you can now better test individual scenarios. With that WebdriverIO catches up with other popular testing tools like [Puppeteer](https://pptr.dev/), [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/) and even simplifies mocking further.

Replacing a REST API request from a browser can now be as simple as follows:

```js
const mock = browser.mock('https://todo-backend-express-knex.herokuapp.com/')

mock.respond([{
    title: 'Injected (non) completed Todo',
    order: null,
    completed: false
}, {
    title: 'Injected completed Todo',
    order: null,
    completed: true
}])

browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

$('#todo-list li').waitForExist()
console.log($$('#todo-list li').map(el => el.getText()))
// outputs: "[ 'Injected (non) completed Todo', 'Injected completed Todo' ]"
```

In addition to that you can als modify JavaScript of CSS files as well as abort requests or modify responses dynamically based on the original reponse. You can find more information on all features in the [Mocks and Spies](/docs/mocksandspies.html) section of the docs.

## Throttling

Aside mocking the new version also ships with another network command that allows to modify the network throughput of the browser allowing to test under different network condition, e.g. Regular 3G or even Offline mode:

```js
// throttle to Regular 3G
browser.throttle('Regular 3G')
// disable network completely
browser.throttle('Offline')
// set custom network throughput
browser.throttle({
    'offline': false,
    'downloadThroughput': 200 * 1024 / 8,
    'uploadThroughput': 200 * 1024 / 8,
    'latency': 20
})
```

This can open up interesting use case where you want to ensure that your progressive web app (PWA) stores all essential resources for offline users to use the application.

## Support

This feature uses Chrome DevTools capabilities to enable such behavior. Therefor it can only be supported where such an interface is available which is __Chrome__, __Firefox Nightly__ and __Chromium Edge__ right now. The Firefox team at Mozilla is working hard to ship this into the stable build of Firefox, therefor support for it can be expected soon.

On top of that the folks at [Sauce Labs](https://saucelabs.com/) working on various of WebDriver extensions that even allow this functionality to be support in the cloud. More updates on this will follow soon.

## Implementation

With this feature WebdriverIO now always incorperates [Puppeteer](https://pptr.dev/) as second automation driver allowing these extra features whenever possible. Moving forward the team is looking into more opportunities to enable Chrome DevTools features into the built in API.

Please let us know what you think! We are expecting some bugs here and there but will make sure to fix them immediately. While we are pretty confident with the current interface design it might be still possible that some tweaks will be applied to make it even more user friendly.

## Give us feedback!

We are releasing this as `beta` feature and hope that you can help us identify weaknesses in the implementation and support. Please give it a try and create an issue if things are unclear or just don't work. We hope with the help of the community and you we are able to ship this as stable within the next months!
