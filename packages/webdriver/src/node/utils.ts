import fs from 'node:fs'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

const log = logger('webdriver')

/**
 * ChromeDriver and EdgeDriver delete the temporary profile they created a few
 * ms after they answered `deleteSession`: wait for that before the kill
 */
const PROFILE_REMOVAL_TIMEOUT = 2000
const PROFILE_POLL_INTERVAL = 10

function kill (pid: number) {
    log.info(`Kill driver process with PID ${pid}`)
    try {
        const killedSuccessfully = process.kill(pid, 'SIGKILL')
        if (!killedSuccessfully) {
            log.warn('Failed to kill driver process, manually clean-up might be required')
        }
    } catch (err) {
        log.warn('Failed to kill driver process', err)
    }

    setTimeout(() => {
        /**
         * clear up potential leaked TLS Socket handles
         * see https://github.com/puppeteer/puppeteer/pull/10667
         */
        for (const handle of process._getActiveHandles()) {
            if (handle.servername && handle.servername.includes('edgedl.me')) {
                handle.destroy()
            }
        }
    }, 10)
}

/**
 * the temporary profile the driver created because the session requested no
 * `--user-data-dir`; the driver never deletes a profile of the user. Unknown
 * when the request is not known: none, `{}` from `attach()` or the session
 * capabilities (they have the `chrome` / `msedge` keys only a driver returns).
 */
function driverProfileOf (capabilities: WebdriverIO.Capabilities, requestedCapabilities?: WebdriverIO.Capabilities) {
    const w3c = requestedCapabilities as Capabilities.W3CCapabilities | undefined
    const requests = [w3c?.alwaysMatch || requestedCapabilities, ...(w3c?.firstMatch || [])].filter(Boolean) as WebdriverIO.Capabilities[]
    if (!requests.some((request) => request.browserName) || requests.some((request) => 'chrome' in request || 'msedge' in request)) {
        return undefined
    }
    const args = requests.flatMap((request) => [...(request['goog:chromeOptions']?.args || []), ...(request['ms:edgeOptions']?.args || [])])
    if (args.some((arg) => typeof arg === 'string' && arg.includes('user-data-dir'))) {
        return undefined
    }
    const caps = capabilities as { chrome?: { userDataDir?: string }, msedge?: { userDataDir?: string } }
    return caps.chrome?.userDataDir || caps.msedge?.userDataDir
}

async function waitForRemoval (profile: string) {
    const start = Date.now()
    while (fs.existsSync(profile)) {
        if (Date.now() - start >= PROFILE_REMOVAL_TIMEOUT) {
            log.warn(`The driver did not delete its temporary profile ${profile} within ${PROFILE_REMOVAL_TIMEOUT}ms`)
            return
        }
        await new Promise((resolve) => setTimeout(resolve, PROFILE_POLL_INTERVAL))
    }
}

/**
 * Kill the driver process after `deleteSession` command is done
 * @param capabilities - the capabilities of the driver
 * @param shutdownDriver - whether to shutdown the driver
 * @param requestedCapabilities - the capabilities the session was requested with
 */
export async function killDriverProcess(capabilities: WebdriverIO.Capabilities, shutdownDriver: boolean, requestedCapabilities?: WebdriverIO.Capabilities) {
    if (!shutdownDriver || !('wdio:driverPID' in capabilities) || !capabilities['wdio:driverPID']) {
        return
    }
    const profile = driverProfileOf(capabilities, requestedCapabilities)
    if (profile) {
        await waitForRemoval(profile)
    }
    kill(capabilities['wdio:driverPID'])
}
