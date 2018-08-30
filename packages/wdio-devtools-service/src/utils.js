import fs from 'fs'
import path from 'path'
import CDP from 'chrome-remote-interface'
import logger from 'wdio-logger'

const log = logger('wdio-devtools-service:utils')

const RE_DEVTOOLS_DEBUGGING_PORT_SWITCH = /--remote-debugging-port=(\d*)/
const RE_USER_DATA_DIR_SWITCH = /--user-data-dir=([^-]*)/

/**
 * Find Chrome DevTools Interface port by checking Chrome switches from the chrome://version
 * page. In case a newer version is used (+v65) we check the DevToolsActivePort file
 */
export async function findChromePort () {
    await global.browser.url('chrome://version')
    const cmdLineTextElem = await global.browser.$('#command_line')
    const cmdLineText = await cmdLineTextElem.getText()
    let port = parseInt(cmdLineText.match(RE_DEVTOOLS_DEBUGGING_PORT_SWITCH)[1], 10)

    /**
     * newer Chrome versions store port in DevToolsActivePort file
     */
    if (port === 0) {
        const userDataDir = cmdLineText.match(RE_USER_DATA_DIR_SWITCH)[1].trim()
        const devToolsActivePortFile = fs.readFileSync(path.join(userDataDir, 'DevToolsActivePort'), 'utf8')
        port = devToolsActivePortFile.split('\n').shift()
    }

    return port
}

export function getCDPClient (port) {
    return new Promise((resolve) => CDP({
        port,
        host: 'localhost',
        target: /* istanbul ignore next */ (targets) => targets.findIndex((t) => t.type === 'page')
    }, resolve))
}

export async function readIOStream (cdp, stream) {
    let isEOF = false
    let tracingChunks = ''

    log.info(`start fetching IO stream with id ${stream}`)
    while (!isEOF) {
        const { data, eof } = await cdp('IO', 'read', { handle: stream })
        tracingChunks += data

        if (eof) {
            isEOF = true
            log.info(`finished fetching IO stream with id ${stream}`)
            return JSON.parse(tracingChunks)
        }
    }
}
