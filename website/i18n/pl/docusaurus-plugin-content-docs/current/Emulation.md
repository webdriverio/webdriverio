---
id: emulation
title: Emulation
---

With WebdriverIO you can emulate Web APIs using the [`emulate`](/docs/api/browser/emulate) command to return custom values that help you emulate certain browser behaviors. Note that this requires your application to explicitly use these APIs.

:::info

This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge and Firefox have such support, Safari **does not**. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental\&label=master\&aligned). Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.

:::

## Geolocation

Change the browser geolocation to a specific area, e.g.:

```ts
await browser.emulate('geolocation', {
    latitude: 52.52,
    longitude: 13.39,
    accuracy: 100
})
await browser.url('https://www.google.com/maps')
await browser.$('aria/Show Your Location').click()
await browser.pause(5000)
console.log(await browser.getUrl()) // outputs: "https://www.google.com/maps/@52.52,13.39,16z?entry=ttu"
```

This will monkey patch how [`navigator.geolocation.getCurrentPosition`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) works and returns the location provided by you.

## Color Scheme

Change the default color scheme setup of the browser via:

```ts
await browser.emulate('colorScheme', 'light')
await browser.url('https://webdriver.io')
const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColor.parsed.hex) // outputs: "#efefef"

await browser.emulate('colorScheme', 'dark')
await browser.url('https://webdriver.io')
const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColor.parsed.hex) // outputs: "#000000"
```

This will monkey patch how [`window.matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) behaves when you query the color scheme via `(prefers-color-scheme: dark)`.

## User Agent

Change the user agent of the browser to a different string via:

```ts
await browser.emulate('userAgent', 'Chrome/1.2.3.4 Safari/537.36')
```

This will change the value of [`navigator.userAgent`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent). Note that browser vendors progressively deprecating the User Agent.

## onLine Property

Change the online status of the browser via:

```ts
await browser.emulate('onLine', false)
```

This will **not** turn off network traffic between the browser and the internet and only changes the return value of [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine). If you are interested modifying network capabilities of the browser, look into the [`throttleNetwork`](throttleNetwork) command.
