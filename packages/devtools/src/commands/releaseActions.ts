/**
 * The Release Actions command is used to release all the keys and pointer buttons that are currently depressed.
 * This causes events to be fired as if the state was released by an explicit series of actions.
 * It also clears all the internal state of the virtual devices.
 *
 * There is no reference implementation for it in Puppeteer so this command will be a NOOP.
 *
 * @alias browser.performActions
 * @see https://w3c.github.io/webdriver/#dfn-release-actions
 */
export default async function performActions () {}
