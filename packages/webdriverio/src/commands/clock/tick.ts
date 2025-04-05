/**
 * Move the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.
 *
 * <example>
    :tick.js
    const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
    console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000

    await clock.tick(1000)
    console.log(await browser.execute(() => new Date().getTime())) // returns 1618383601000
 * </example>
 *
 * @alias clock.tick
 * @param    { number }  ms  The number of milliseconds to move the clock.
 * @returns  { `Promise<void>` }
 */
// actual implementation is located in packages/webdriverio/src/clock.ts

