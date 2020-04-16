import os from 'os'
import { v4 as uuidv4 } from 'uuid'

import launch from '../launcher'
import { sessionMap } from '../index'

export default async function newSession ({ capabilities }) {
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
