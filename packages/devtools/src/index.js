import os from 'os'
import uuidv4 from 'uuid/v4'

import DevToolsDriver from './devtoolsdriver'
import launch from './launcher'

const driver = new DevToolsDriver()

const sessionMap = new Map()

function commandWrapper (_, __, commandInfo) {
    return driver.register(commandInfo, sessionMap)
}

export default async function startDevToolsSession (params) {
    /**
     * the user could have passed in either w3c style or jsonwp style caps
     * and we want to pass both styles to the server, which means we need
     * to check what style the user sent in so we know how to construct the
     * object for the other style
     */
    const [w3cCaps, jsonwpCaps] = params.capabilities && params.capabilities.alwaysMatch
        /**
         * in case W3C compliant capabilities are provided
         */
        ? [params.capabilities, params.capabilities.alwaysMatch]
        /**
         * otherwise assume they passed in jsonwp-style caps (flat object)
         */
        : [{ alwaysMatch: params.capabilities, firstMatch: [{}] }, params.capabilities]

    const browser = await launch(params.capabilities)

    const pages = await browser.pages()
    await pages[0].close()

    const sessionId = uuidv4()
    const [browserName, browserVersion] = (await browser.version()).split('/')

    params.capabilities = {
        browserName,
        browserVersion,
        platformName: os.platform(),
        platformVersion: os.release()
    }

    /**
     * save original set of capabilities to allow to request the same session again
     * (e.g. for reloadSession command in WebdriverIO)
     */
    params.requestedCapabilities = { w3cCaps, jsonwpCaps }

    sessionMap.set(sessionId, browser)
    return { sessionId, commandWrapper }
}
