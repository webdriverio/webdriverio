/**
 * Change the system time to the new now. Now can be a timestamp, date object, or not passed in which defaults
 * to 0. No timers will be called, nor will the time left before they trigger change.
 *
 * <example>
    :setSystemTime.js
    const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
    console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000

    await clock.setSystemTime(new Date(2011, 3, 15))
    console.log(await browser.execute(() => new Date().getTime())) // returns 1302850800000
 * </example>
 *
 * @alias clock.setSystemTime
 * @param   { Date | number } date The new date to set the system time to.
 * @returns { `Promise<void>` }
 */
// actual implementation is located in packages/webdriverio/src/clock.ts
