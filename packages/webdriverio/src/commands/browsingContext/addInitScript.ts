/**
 * Adds a script which would be evaluated in one of the following scenarios:
 *
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in
 *   the context of the newly attached frame.
 *
 * The script is evaluated after the document was created but before any of its scripts were run.
 * In order to remove the initialization script from the page again, call the function that got
 * returned by this function.
 *
 * This is useful to amend the JavaScript environment, e.g. to seed Math.random.
 *
 * <example>
    :addInitScript.js
    const page = await browser.url('https://webdriver.io')
    const script = await page.addInitScript((seed) => {
        Math.random = () => seed
    }, 42)

    await page.refresh()
    console.log(await page.execute(() => Math.random())) // returns 42

    await reset()
    await page.refresh()
    console.log(await page.execute(() => Math.random())) // returns a random number
 * </example>
 *
 * Furthermore you can also use the `emit` function to send data back to the Node.js environment.
 * This is useful if you want to observe certain events in the browser environment, e.g.:
 *
 * <example>
    :addInitScriptWithEmit.js
    const page = await browser.url('https://webdriver.io')
    const script = await page.addInitScript((emit) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          emit(mutation.target.nodeName)
        }
      })
      observer.observe(document, { childList: true, subtree: true })
    })

    script.on('data', (data) => {
      console.log(data) // prints: BODY, DIV, P, ...
    })
 * </example>
 *
 * @alias page.addInitScript
 * @param {Function}              script  function to be injected as initialization script
 * @param {number|string|boolean} args    parameters for the script
 * @type utility
 *
 */
import { addInitScript as browserAddInitScript } from '../browser/addInitScript.js'
export const addInitScript = browserAddInitScript
