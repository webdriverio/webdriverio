import { switchFrame as switchFrameCommand } from '../browser/switchFrame.js'

/**
 * Switches the active context to a frame, e.g. an iframe on the page. There are multiple ways you can query a frame
 * on the page:
 *
 *   - If given a string it switches to the frame with a matching context id, url or url that contains that string
 *     ```ts
 *     // switch to a frame that has a specific url or contains a string in the url
 *     const context = await browser.url('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe')
 *     // Note: this frame is located in a nested iframe, however you only need to provide
 *     // the frame url of your desired frame
 *     const frame = await context.switchFrame('https://www.w3schools.com')
 *     // check the title of the page
 *     console.log(await frame.execute(() => [document.title, document.URL]))
 *     // outputs: [ 'W3Schools Online Web Tutorials', 'https://www.w3schools.com/' ]
 *     ```
 *
 *   - If you have the context id of the frame you can use it directly
 *     ```ts
 *     // switch to a frame that has a certain context id
 *     const frame = await browser.switchFrame('A5734774C41F8C91D483BDD4022B2EF3')
 *     ```
 *
 *   - If given a WebdriverIO element that references an `iframe` element it will switch to that frame
 *     ```ts
 *     // switch to a frame element queried from current context
 *     const context = await browser.url('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe')
 *     const elem = await context.$('iframe')
 *     const frame = await context.switchFrame(elem)
 *     ```
 *
 *   - If given a function it will loop through all iframes on the page and call the function within the context
 *     object. The function should return a boolean indicating if the frame should be selected. The function
 *     will be executed within the browser and allows access to all Web APIs, e.g.:
 *     ```ts
 *     const context = await browser.url('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe')
 *     // switch to first frame that contains an element with id "#frameContent"
 *     const frame = await context.switchFrame(() => Boolean(document.querySelector('#frameContent')))
 *     // switch to first frame that contains "webdriver" in the URL
 *     const frame = await context.switchFrame(() => document.URL.includes('webdriver'))
 *     ```
 *
 *   - If given `null` it will switch to the top level frame
 *     ```ts
 *     // first switch into a frame
 *     const context = await browser.url('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe')
 *     const elem = await context.$('iframe')
 *     const frame = await context.switchFrame(elem)
 *     // do more automation within that frame, then ...
 *
 *     // switch to the top level frame
 *     await browser.switchFrame(null)
 *     ```
 *
 * Once you switched to a frame, all further commands will be executed in the context of that frame,
 * including navigating to different pages.
 *
 * @alias browser.switchFrame
 * @param {string|object|function} context
 * @returns {Promise<string>} the current active context id
 */
export const switchFrame = switchFrameCommand