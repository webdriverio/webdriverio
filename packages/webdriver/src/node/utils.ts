import fs from 'node:fs'
import logger from '@wdio/logger'

const log = logger('webdriver')

/**
 * ChromeDriver and EdgeDriver delete the temporary profile they created a few
 * ms after they answered `deleteSession`: wait for that before the kill
 */
const PROFILE_REMOVAL_TIMEOUT = 2000
const PROFILE_POLL_INTERVAL = 10
/**
 * drivers whose kill waits for their profile, killed at once when the process exits
 */
const waitingDrivers = new Set<number>()
let exitListenerAdded = false

function killWaitingDrivers () {
    for (const pid of waitingDrivers) {
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
 * the temporary profile the driver created for the session (`scoped_dir` in
 * its name); a `--user-data-dir` of the user is never deleted, so no wait
 */
function driverProfileOf (capabilities: WebdriverIO.Capabilities) {
    const caps = capabilities as { chrome?: { userDataDir?: string }, 'ms:edge'?: { userDataDir?: string } }
    const userDataDir = caps.chrome?.userDataDir || caps['ms:edge']?.userDataDir
    return userDataDir && userDataDir.includes('scoped_dir') ? userDataDir : undefined
}

/**
 * Kill the driver process after `deleteSession` command is done
 * @param capabilities - the capabilities of the driver
 * @param shutdownDriver - whether to shutdown the driver
 */
export function killDriverProcess(capabilities: WebdriverIO.Capabilities, shutdownDriver: boolean) {
    if (!shutdownDriver || !('wdio:driverPID' in capabilities) || !capabilities['wdio:driverPID']) {
        return
    }
    const pid = capabilities['wdio:driverPID']
    const profile = driverProfileOf(capabilities)
    if (!profile) {
        return kill(pid)
    }

    if (!exitListenerAdded) {
        exitListenerAdded = true
        process.once('exit', killWaitingDrivers)
    }
    waitingDrivers.add(pid)
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
