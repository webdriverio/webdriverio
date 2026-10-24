import logger from '@wdio/logger'

import { SessionManager } from './session.js'

const log = logger('webdriverio:BidiMapperLogManager')

const MAPPER_TITLE = 'BiDi-CDP Mapper'

/**
 * Runs in the page of the BiDi Mapper. Without `#logs`, the Mapper does not
 * write the BiDi messages into its page; nothing else reads that element.
 */
export const REMOVE_MAPPER_LOG = `if (document.title === "${MAPPER_TITLE}") { document.getElementById("logs")?.remove() }`

interface TargetInfo {
    targetId: string
    type: string
    title: string
}

/**
 * a grid or a cloud service can block the ChromeDriver CDP endpoint, and each
 * failed request is retried, so do not use it again in this process
 */
let isEndpointBlocked = false

export function getBidiMapperLogManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, BidiMapperLogManager)
}

/**
 * ChromeDriver runs the BiDi Mapper in a hidden target with a 0x0 viewport, and
 * the Mapper writes each BiDi message into its page. The layout of that 20px wide
 * log makes each large message (e.g. a screenshot) slower than the one before:
 * https://issues.chromium.org/issues/577213792
 * Remove this manager when Chrome fixes that issue.
 */
export class BidiMapperLogManager extends SessionManager {
    #initialize: Promise<boolean>

    constructor(browser: WebdriverIO.Browser) {
        super(browser, BidiMapperLogManager.name)

        if (!this.isEnabled() || !browser.isChromium || isEndpointBlocked) {
            this.#initialize = Promise.resolve(true)
            return
        }

        this.#initialize = removeMapperLog(browser).then(() => true, (err: Error) => {
            isEndpointBlocked = true
            log.debug(`Could not remove the log of the BiDi Mapper: ${err.message}`)
            return false
        })
    }

    async initialize() {
        return this.#initialize
    }
}

async function removeMapperLog(browser: WebdriverIO.Browser) {
    // hidden targets are listed only with an explicit filter
    const { targetInfos } = await browser.sendCommandAndGetResult('Target.getTargets', { filter: [{}] }) as { targetInfos: TargetInfo[] }
    // the Mapper target is `other` in Chrome and `page` in chrome-headless-shell; `tab` is its tab entry
    for (const { targetId } of targetInfos.filter(({ title, type }) => title === MAPPER_TITLE && type !== 'tab')) {
        /**
         * the ChromeDriver endpoint takes no CDP session id, so only the non-flat
         * mode (deprecated, https://crbug.com/991325) can reach another target
         */
        const { sessionId } = await browser.sendCommandAndGetResult('Target.attachToTarget', { targetId, flatten: false }) as { sessionId: string }
        try {
            await browser.sendCommandAndGetResult('Target.sendMessageToTarget', {
                sessionId,
                message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: REMOVE_MAPPER_LOG } })
            })
        } finally {
            await browser.sendCommandAndGetResult('Target.detachFromTarget', { sessionId })
        }
    }
}
