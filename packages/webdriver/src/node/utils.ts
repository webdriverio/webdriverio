import logger from '@wdio/logger'

const log = logger('webdriver')

/**
 * Kill the driver process after `deleteSession` command is done
 * @param capabilities - the capabilities of the driver
 * @param shutdownDriver - whether to shutdown the driver
 */
export function killDriverProcess(capabilities: WebdriverIO.Capabilities, shutdownDriver: boolean) {
    if (shutdownDriver && 'wdio:driverPID' in capabilities && capabilities['wdio:driverPID']) {
        log.info(`Kill driver process with PID ${capabilities['wdio:driverPID']}`)
        try {
            const killedSuccessfully = process.kill(capabilities['wdio:driverPID'], 'SIGKILL')
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
}
