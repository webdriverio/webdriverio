---
id: emulation
title: Emulation
description: "Emulate geolocation, media features, user agent, network, locale, timezone, screen and devices with the emulate command."
---

With WebdriverIO you can emulate browser behavior using the [`emulate`](/docs/api/browser/emulate) command. The command drives the [WebDriver BiDi emulation module](https://w3c.github.io/webdriver-bidi/#module-emulation) for the current top-level browsing context. The override applies immediately. You do not reload the page. `clock` is the exception: BiDi has no clock command, so that scope still installs fake timers.

<LiteYouTubeEmbed
    id="2bQXzIB_97M"
    title="WebdriverIO Tutorials: The Emulate Command - Emulate Web APIs at Runtime with WebdriverIO"
/>

:::info

This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/emulation?label=experimental&label=master&aligned). Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.

To enable WebDriver Bidi for your test, make sure to have `webSocketUrl: true` set in your capabilities.

A browser that does not implement a command rejects the call with its own error, `unknown command` or `unsupported operation`. WebdriverIO returns that error. It does not fall back to a preload script or to CDP.

:::

`emulate` returns a function that clears that scope. [`browser.restore()`](/docs/api/browser/restore) clears every active scope, or the scopes you list.

## Geolocation

Change the browser geolocation to a specific area, e.g.:

```ts
await browser.emulate('geolocation', {
    latitude: 52.52,
    longitude: 13.39,
    accuracy: 100
})
await browser.setPermissions({ name: 'geolocation' }, 'granted')
await browser.url('https://www.google.com/maps')
await browser.$('aria/Show Your Location').click()
await browser.pause(5000)
console.log(await browser.getUrl()) // outputs: "https://www.google.com/maps/@52.52,13.39,16z?entry=ttu"
```

This uses the browser geolocation stack, including `getCurrentPosition` and `watchPosition`. A page can still need the geolocation permission granted, as in the example. Optional fields are `accuracy`, `altitude`, `altitudeAccuracy`, `heading` and `speed`.

To make the page fail to read a position:

```ts
await browser.emulate('geolocation', { error: 'positionUnavailable' })
```

## Color Scheme and other media features

Change the `prefers-color-scheme` media feature:

```ts
await browser.emulate('colorScheme', 'light')
await browser.url('https://webdriver.io')
const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColor.parsed.hex) // outputs: "#efefef"

await browser.emulate('colorScheme', 'dark')
const backgroundColorDark = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColorDark.parsed.hex) // outputs: "#000000"
```

This updates CSS `@media (prefers-color-scheme)` as well as [`window.matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia). No reload is required.

`media` sets the rest of the media-feature map, for example reduced motion:

```ts
await browser.emulate('media', { prefersReducedMotion: 'reduce', hover: 'none' })
```

`colorScheme` and `media` share one map. The BiDi command replaces the whole map, so the later call wins. Restoring either scope clears the map.

`forcedColors` is a different command. It sets the forced-colors theme (`'light'` or `'dark'`), not the `forced-colors` media feature. That media feature stays on `media` as `forcedColors: 'none' | 'active'`.

## User Agent

Change the user agent of the browser via:

```ts
await browser.emulate('userAgent', 'Chrome/1.2.3.4 Safari/537.36')
```

This is the browser's user-agent override. It is not a patched `navigator.userAgent` property. Browser vendors are progressively deprecating the User Agent.

## Online state

Take the browsing context offline:

```ts
await browser.emulate('onLine', false)
```

`false` sends `emulation.setNetworkConditions` with `{ type: 'offline' }`. Fetch, WebSocket and WebTransport fail, and [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) follows. `true`, and restoring the scope, clears the condition. Throughput and latency stay on [`throttleNetwork`](/docs/api/browser/throttleNetwork). BiDi network conditions only support offline.

## Locale, timezone and touch

```ts
await browser.emulate('locale', 'fr-FR')
await browser.emulate('timezone', 'Pacific/Honolulu')
await browser.emulate('touch', 1)
```

`locale` is a BCP 47 tag. `timezone` is an IANA name or an offset such as `+02:00`. `touch` is `maxTouchPoints` and must be an integer `>= 1`. Restoring `touch` clears the override. It cannot set `0`.

## Screen, orientation and layout

```ts
await browser.emulate('screen', { width: 390, height: 844 })
await browser.emulate('orientation', { natural: 'portrait', type: 'portrait-primary' })
await browser.emulate('viewportMeta', true)
await browser.emulate('textLayout', 'mobile')
await browser.emulate('scrollbar', 'overlay')
await browser.emulate('scripting', false)
```

`screen` is the web-exposed screen area, not the viewport. `orientation.natural` is `'portrait'` or `'landscape'`. `orientation.type` is `'portrait-primary'`, `'portrait-secondary'`, `'landscape-primary'` or `'landscape-secondary'`.

`viewportMeta` only accepts `true`. The spec value is `true | null`, so there is no `false`. Restore clears it. `textLayout` only accepts `'mobile'`. `scripting` can only be disabled. The spec cannot force scripting on. `scrollbar` is `'classic'` or `'overlay'`.

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

The `emulate` command also supports emulating a certain mobile or desktop device. This should, by no means, be used for mobile testing as desktop browser engines differ from mobile ones. This should only be used if your application offers a specific behavior for smaller viewport sizes.

For a device, WebdriverIO:

- sets the user agent from the descriptor
- sets the viewport and device scale factor
- sets `maxTouchPoints` to `1` when the descriptor has touch, and clears touch otherwise
- sets mobile text layout and the viewport meta tag when the descriptor is mobile, and clears them otherwise

It does not invent a screen size or an orientation from the device name. Viewport is not `screen.width`. Use the `screen` and `orientation` scopes for those.

The viewport change is sent to the top-level context that was current when `emulate` was called. Restoring the device resizes that context, including after a switch to another window.

If the browser rejects one of those commands, the previous user agent, viewport, touch, text layout and viewport meta are put back and the error is returned. A custom user agent or `setViewport` size is not replaced with a default.

```ts
const restore = await browser.emulate('device', 'iPhone 15')
// test your application ...

// reset user agent, viewport, touch, text layout and viewport meta
await restore()
```

WebdriverIO maintains a fixed list of [all defined devices](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/deviceDescriptorsSource.ts).
