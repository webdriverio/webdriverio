/**
 * Restore all overridden native functions. This is automatically called between tests, so should not
 * generally be needed.
 *
 * <example>
    :restore.js
    console.log(new Date()) // returns e.g. 1722560447102

    const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
    console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000

    await clock.restore()
    console.log(await browser.execute(() => new Date().getTime())) // returns 1722560447102
 * </example>
 *
 * @alias clock.restore
 * @returns { `Promise<void>` }
 */
// actual implementation is located in packages/webdriverio/src/clock.ts
