import { remote } from 'webdriverio'

type RemoteParams = Parameters<typeof remote>[0]

const TRANSIENT_DRIVER_ERROR = /EBUSY|ECONNREFUSED|Unable to connect|Timed out to connect|EAGAIN/i
const SESSION_RETRY_ATTEMPTS = 3
const SESSION_RETRY_DELAY = 500

/**
 * Start a local Chrome session, retrying when the previous Chromedriver
 * process is still shutting down (Windows `spawn EBUSY`) or the driver
 * dies immediately after binding its port.
 */
export async function startStandaloneChrome (overrides: Partial<RemoteParams> = {}) {
    let lastError: unknown
    for (let attempt = 1; attempt <= SESSION_RETRY_ATTEMPTS; attempt++) {
        try {
            return await remote({
                capabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
                },
                ...overrides
            })
        } catch (err) {
            lastError = err
            const message = err instanceof Error ? err.message : String(err)
            if (!TRANSIENT_DRIVER_ERROR.test(message) || attempt === SESSION_RETRY_ATTEMPTS) {
                throw err
            }
            await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAY * attempt))
        }
    }
    throw lastError
}
