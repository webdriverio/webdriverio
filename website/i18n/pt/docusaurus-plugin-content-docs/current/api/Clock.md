---
id: clock
title: The Clock Object
---

You can modify the browser system clock using the [`emulate`](/docs/emulation) command. It overrides native global functions related to time allowing them to be controlled synchronously via `clock.tick()` or the yielded clock object. This includes controlling:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `Date Objects`

The clock starts at the unix epoch (timestamp of 0). This means that when you instantiate new Date in your application, it will have a time of January 1st, 1970 if you don't pass any other options to the `emulate` command.

## Example

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

await browser.url('http://guinea-pig.webdriver.io/pointer.html')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

You can modify the system time by calling [`setSystemTime`](/docs/api/clock/setSystemTime) or [`tick`](/docs/api/clock/tick).
