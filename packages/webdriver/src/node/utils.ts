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
/**
 * at process exit the wait can only block: keep it short
 */
const EXIT_WAIT_POLLS = 20
/**
 * drivers whose kill waits for their profile (pid -> profile)
 */
const waitingDrivers = new Map<number, string>()
let exitListenerAdded = false

function killWaitingDrivers () {
    const sleep = new Int32Array(new SharedArrayBuffer(4))
    for (let poll = 0; poll < EXIT_WAIT_POLLS && [...waitingDrivers.values()].some((profile) => fs.existsSync(profile)); poll++) {
        Atomics.wait(sleep, 0, 0, PROFILE_POLL_INTERVAL)
    }
    for (const pid of waitingDrivers.keys()) {
        kill(pid)
    }
    waitingDrivers.clear()
}

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
 * `--user-data-dir`; the driver never deletes a profile of the user
 */
function driverProfileOf (capabilities: WebdriverIO.Capabilities, requestedCapabilities?: WebdriverIO.Capabilities) {
    if (!requestedCapabilities) {
        return undefined
    }
    const requested = (requestedCapabilities as Capabilities.W3CCapabilities).alwaysMatch || requestedCapabilities
    const args = [...(requested['goog:chromeOptions']?.args || []), ...(requested['ms:edgeOptions']?.args || [])]
    if (args.some((arg) => typeof arg === 'string' && arg.includes('user-data-dir'))) {
        return undefined
    }
    const caps = capabilities as { chrome?: { userDataDir?: string }, msedge?: { userDataDir?: string } }
    return caps.chrome?.userDataDir || caps.msedge?.userDataDir
}

/**
 * Kill the driver process after `deleteSession` command is done
 * @param capabilities - the capabilities of the driver
 * @param shutdownDriver - whether to shutdown the driver
 * @param requestedCapabilities - the capabilities the session was requested with
 */
export function killDriverProcess(capabilities: WebdriverIO.Capabilities, shutdownDriver: boolean, requestedCapabilities?: WebdriverIO.Capabilities) {
    if (!shutdownDriver || !('wdio:driverPID' in capabilities) || !capabilities['wdio:driverPID']) {
        return
    }
    const pid = capabilities['wdio:driverPID']
    const profile = driverProfileOf(capabilities, requestedCapabilities)
    if (!profile) {
        return kill(pid)
    }

    if (!exitListenerAdded) {
        exitListenerAdded = true
        process.once('exit', killWaitingDrivers)
    }
    waitingDrivers.set(pid, profile)
    const start = Date.now()
    const waitForProfile = () => {
        // already killed because the process exits
        if (!waitingDrivers.has(pid)) {
            return
        }
        if (fs.existsSync(profile) && Date.now() - start < PROFILE_REMOVAL_TIMEOUT) {
            setTimeout(waitForProfile, PROFILE_POLL_INTERVAL).unref()
            return
        }
        waitingDrivers.delete(pid)
        kill(pid)
    }
    setTimeout(waitForProfile, PROFILE_POLL_INTERVAL).unref()
}
