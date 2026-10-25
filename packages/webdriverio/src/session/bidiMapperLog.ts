import logger from '@wdio/logger'
import { capabilitiesEnvironmentDetector } from '@wdio/utils'

import { SessionManager } from './session.js'
import { environment } from '../environment.js'

const log = logger('webdriverio:BidiMapperLogManager')

const MAPPER_TITLE = 'BiDi-CDP Mapper'

/**
 * Chrome lists the Mapper as `other` (chrome-headless-shell: `page`), and also
 * as a `tab` that runs no script
 */
const MAPPER_TYPES = ['other', 'page']

/**
 * before, the Mapper is a page with a viewport and its log does not slow down
 * the commands (and Chrome 132 has no `goog:cdp`)
 */
const FIRST_SLOW_VERSION = 137

export const MAPPER_LOG_TIMEOUT = 5000

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

interface CdpBidiHandler {
    send (command: { method: 'goog:cdp.sendCommand', params: { method: string, params: object } }): Promise<{ result?: { result?: unknown } }>
}

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

        // `browser.isChromium` does not change with `reloadSession()` to another browser
        const { isChromium } = capabilitiesEnvironmentDetector(browser.capabilities)
        // NaN for an unknown version, which does not skip
        const majorVersion = parseInt(browser.capabilities.browserVersion ?? '', 10)
        if (!this.isEnabled() || !isChromium || browser.isMobile || majorVersion < FIRST_SLOW_VERSION) {
            this.#initialize = Promise.resolve(true)
            return
        }
        // the switch to turn off the fix when it causes a problem
        if (['1', 'true'].includes(environment.value.variables.WDIO_KEEP_BIDI_MAPPER_LOG?.toLowerCase() ?? '')) {
            log.info('WDIO_KEEP_BIDI_MAPPER_LOG is set: keep the log of the ChromeDriver BiDi Mapper')
            this.#initialize = Promise.resolve(true)
            return
        }

        this.#initialize = withTimeout((signal) => removeMapperLog(browser, signal)).then(() => true, (err: Error) => {
            log.warn(
                `Could not remove the log of the ChromeDriver BiDi Mapper (${err.message}), so large ` +
                'WebDriver BiDi messages (e.g. screenshots) can make the next commands slower: ' +
                'https://issues.chromium.org/issues/577213792'
            )
            return false
        })
    }

    async initialize() {
        return this.#initialize
    }
}

/**
 * after the timeout, `run` sends no new command; the race also handles its late rejection
 */
function withTimeout(run: (signal: AbortSignal) => Promise<void>) {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            controller.abort()
            reject(new Error(`no answer after ${MAPPER_LOG_TIMEOUT}ms`))
        }, MAPPER_LOG_TIMEOUT)
    })
    return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer))
}

async function removeMapperLog(browser: WebdriverIO.Browser, signal: AbortSignal) {
    /**
     * CDP through the BiDi connection (chromium-bidi `goog:cdp.sendCommand`)
     * also reaches the browser through a grid or a cloud service
     */
    const handler = (browser as unknown as { _bidiHandler: CdpBidiHandler })._bidiHandler
    const cdp = async <T>(method: string, params: object) => (
        await handler.send({ method: 'goog:cdp.sendCommand', params: { method, params } })
    ).result?.result as T

    // hidden targets are listed only with an explicit filter
    const { targetInfos } = await cdp<{ targetInfos: TargetInfo[] }>('Target.getTargets', { filter: [{}] })
    let error: unknown
    for (const { targetId } of targetInfos.filter(({ title, type }) => title === MAPPER_TITLE && MAPPER_TYPES.includes(type))) {
        if (signal.aborted) {
            return
        }
        try {
            /**
             * the Mapper detaches the flat sessions of its own target, so only the
             * non-flat mode (deprecated, https://crbug.com/991325) can reach it
             */
            const { sessionId } = await cdp<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: false })
            try {
                if (!signal.aborted) {
                    await cdp('Target.sendMessageToTarget', {
                        sessionId,
                        message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: REMOVE_MAPPER_LOG } })
                    })
                }
            } finally {
                // the log is already gone when only the detach fails
                await cdp('Target.detachFromTarget', { sessionId }).catch((err: Error) => {
                    log.debug(`Could not detach from the BiDi Mapper: ${err.message}`)
                })
            }
        } catch (err) {
            error ??= err
        }
    }
    if (error) {
        throw error
    }
}
