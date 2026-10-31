import os from 'node:os'

// Firefox profiles in %TEMP% fill the queue of the C: OS disk of a Windows runner and Firefox stalls; RUNNER_TEMP is on D:
const profileRoot = os.platform() === 'win32' ? process.env.RUNNER_TEMP : undefined

export const firefoxDriverOptions: WebdriverIO.Capabilities = profileRoot ? { 'wdio:geckodriverOptions': { profileRoot } } : {}
