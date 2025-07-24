---
id: emulation
title: Emulation
---

With WebdriverIO you can emulate Web APIs using the [`emulate`](/docs/api/browser/emulate) command to return custom values that help you emulate certain browser behaviors. Note that this requires your application to explicitly use these APIs.

<LiteYouTubeEmbed
    id="2bQXzIB_97M"
    title="WebdriverIO Tutorials: The Emulate Command - Emulate Web APIs at Runtime with WebdriverIO"
/>

:::info

This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental&label=master&aligned). Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.

To enable WebDriver Bidi for your test, make sure to have `webSocketUrl: true` set in your capabilities.

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

This will __not__ turn off network traffic between the browser and the internet and only changes the return value of [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine). If you are interested modifying network capabilities of the browser, look into the [`throttleNetwork`](/docs/api/browser/throttleNetwork) command.

## Clock

You can modify the browser system clock using the [`emulate`](/docs/emulation) command. It overrides native global functions related to time allowing them to be controlled synchronously via `clock.tick()` or the yielded clock object. This includes controlling:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `Date Objects`

The clock starts at the unix epoch (timestamp of 0). This means that when you instantiate new Date in your application, it will have a time of January 1st, 1970 if you don't pass any other options to the `emulate` command.

##### Example

When calling `browser.emulate('clock', { ... })` it will immediately overwrite the global functions for the current page as well as all following pages, e.g.:

```ts
const clock = await browser.emulate('clock', { now: new Date(1989, 7, 4) })

console.log(await browser.execute(() => (new Date()).toString()))
// returns "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await browser.url('https://webdriverio')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await clock.restore()

console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"

await browser.url('https://guinea-pig.webdriver.io/pointer.html')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

You can modify the system time by calling [`setSystemTime`](/docs/api/clock/setSystemTime) or [`tick`](/docs/api/clock/tick).

The `FakeTimerInstallOpts` object can have the following properties:

 ```ts
interface FakeTimerInstallOpts {
    // Installs fake timers with the specified unix epoch
    // @default: 0
    now?: number | Date | undefined;

    // An array with names of global methods and APIs to fake. By default, WebdriverIO
    // does not replace `nextTick()` and `queueMicrotask()`. For instance,
    // `browser.emulate('clock', { toFake: ['setTimeout', 'nextTick'] })` will fake only
    // `setTimeout()` and `nextTick()`
    toFake?: FakeMethod[] | undefined;

    // The maximum number of timers that will be run when calling runAll() (default: 1000)
    loopLimit?: number | undefined;

    // Tells WebdriverIO to increment mocked time automatically based on the real system
    // time shift (e.g. the mocked time will be incremented by 20ms for every 20ms change
    // in the real system time)
    // @default false
    shouldAdvanceTime?: boolean | undefined;

    // Relevant only when using with shouldAdvanceTime: true. increment mocked time by
    // advanceTimeDelta ms every advanceTimeDelta ms change in the real system time
    // @default: 20
    advanceTimeDelta?: number | undefined;

    // Tells FakeTimers to clear 'native' (i.e. not fake) timers by delegating to their
    // respective handlers. These are not cleared by default, leading to potentially
    // unexpected behavior if timers existed prior to installing FakeTimers.
    // @default: false
    shouldClearNativeTimers?: boolean | undefined;
}
```

## Device

The `emulate` command also supports emulating a certain mobile or desktop device by changing the viewport, device scale factor and the user agent. This should, by no means, be used for mobile testing as desktop browser engines differ from mobile ones. This should only be used if your application offers a specific behavior for smaller viewport sizes.

For example, to switch the user agent and viewport to an iPhone 15, just run:

```ts
const restore = await browser.emulate('device', 'iPhone 15')
// test your application ...

// reset to original viewport and user agent
await restore()
```

WebdriverIO maintains a fixed list of [all defined devices](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/deviceDescriptorsSource.ts).
