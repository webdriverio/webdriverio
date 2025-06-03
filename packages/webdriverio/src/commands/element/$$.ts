/**
 * The `$$` command is a short and handy way in order to fetch multiple elements on the page.
 * It returns an `WebdriverIO.ElementArray` containing an array of WebdriverIO elements.
 *
 * :::info
 *
 * As opposed to the [`$$`](/docs/api/browser/$$) attached to the [browser object](/docs/api/browser)
 * this command queries elements based on a root element.
 *
 * :::
 *
 * You can chain `$` or `$$` together without wrapping individual commands into `await` in order
 * to walk down the DOM tree, e.g.:
 *
 * ```js
 * const imageSrc = await $$('div')[1].nextElement().$$('img')[2].getAttribute('src')
 * ```
 *
 * WebdriverIO seamlessly traverses shadow roots when using the `$` or `$$` commands, regardless of the nesting level or
 * shadow root mode, for example:
 *
 * ```js
 * await browser.url('https://ionicframework.com/docs/usage/v8/datetime/basic/demo.html?ionic:mode=md')
 * await browser.$('button[aria-label="Sunday, August 4"]').click()
*  await browser.$('.aux-input').getValue()
* ```
 *
 * It is also possible to use async iterators to loop over the result of the query, e.g.:
 *
 * ```js
 * // print all image sources
 * for await (const img of $$('img')) {
 *   console.log(await img.getAttribute('src'))
 * }
 * ```
 *
 * :::info
 *
 * For more information on how to select specific elements, check out the [Selectors](/docs/selectors) guide.
 *
 * :::
 *
 * @alias $$
 * @param {String|Function|Matcher} selector  selector, JS Function, or Matcher object to fetch multiple elements
 * @return {WebdriverIO.ElementArray}
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/example.html
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L6-L7
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L15-L24
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L32-L39
 * @type utility
 *
 */
import { $$ as browser$$ } from '../browser/$$.js'
export const $$ = browser$$
