import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Delete Session command closes any top-level browsing contexts associated
 * with the current session, terminates the connection, and finally closes the current session.
 *
 * @alias browser.deleteSession
 * @see https://w3c.github.io/webdriver/#dfn-delete-session
 */
export default async function deleteSession (this: DevToolsDriver) {
    await this.browser.close()
    this.windows.clear()
    return null
}
