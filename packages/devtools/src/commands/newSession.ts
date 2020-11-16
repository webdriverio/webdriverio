/**
 * The New Session command creates a new WebDriver session with the endpoint node.
 * If the creation fails, a session not created error is returned.
 *
 * @alias browser.newSession
 * @see https://w3c.github.io/webdriver/#dfn-new-sessions
 * @param  {Object} capabilities An object describing the set of capabilities for the capability processing algorithm
 * @return {Object}              Object containing sessionId and capabilities of created WebDriver session.
 */

import os from 'os'
import { v4 as uuidv4 } from 'uuid'

import launch from '../launcher'
import { sessionMap } from '../index'
import type DevToolsDriver from '../devtoolsdriver'

export default async function newSession (
    this: DevToolsDriver,
    { capabilities }: { capabilities: WebDriver.Capabilities }
) {
    const browser = await launch(capabilities)
    const sessionId = uuidv4()
    const [browserName, browserVersion] = (await browser.version()).split('/')

    sessionMap.set(sessionId, browser)

    return {
        sessionId,
        capabilities: {
            browserName,
            browserVersion,
            platformName: os.platform(),
            platformVersion: os.release()
        }
    }
}
