import { emulate as browserEmulate } from '../browser/emulate.js'

/**
 * WebdriverIO allows you to emulate Web APIs using the `emulate` command. These Web APIs can then
 * behave exactly as you specify it. The following scopes are supported:
 *
 * - `geolocation`: Emulate the geolocation API
 * - `userAgent`: Emulate the user agent
 * - `colorScheme`: Emulate the color scheme
 * - `onLine`: Emulate the online status
 * - `device`: Emulate a specific mobile or desktop device
 * - `clock`: Emulate the system clock
 *
 * The `emulate` command returns a function that can be called to reset the emulation. This is useful
 * when you want to reset the emulation after a test or a suite of tests.
 *
 * Read more on this in the [Emulation](/docs/emulation) guidelines.
 *
 * :::info
 *
 * Except for the `clock` scope it is not possible to change the emulated value without reloading the page.
 *
 * :::
 *
 * :::info
 *
 * This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge
 * and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental&label=master&aligned).
 * Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.
 *
 * :::
 *
 * The `EmulationOptions` object can have the following properties based on the scope:
 *
 * | Scope         | Options                                          |
 * |---------------|--------------------------------------------------|
 * | `geolocation` | `{ latitude: number, longitude: number }`        |
 * | `userAgent`   | `string`                                         |
 * | `colorScheme` | `'light' \| 'dark'`                              |
 * | `onLine`      | `boolean`                                        |
 * | `clock`       | `FakeTimerInstallOpts`                           |
 *
 * @param {string} scope feature of the browser you like to emulate, can be either `clock`, `geolocation`, `userAgent`, `colorScheme` or `onLine`
 * @param {EmulationOptions} options emulation option for specific scope
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L4-L18
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L20-L36
 * @returns {Function}  a function to reset the emulation
 */
export const emulate = browserEmulate