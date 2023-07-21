import type { RunnerStats } from '@wdio/reporter'

const runner =  (): RunnerStats => ({
    type: 'runner',
    start: '2018-05-14T15:17:18.901Z',
    _duration: 0,
    cid: '0-0',
    capabilities: { browserName: 'chrome', version: '68' }, // session capabilities
    sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
    config: { capabilities: { browserName: 'chrome' } }, // user capabilities
    specs: ['/tmp/user/spec.js']
} as any)

export function runnerStart() {
    return Object.assign(runner())
}

export function runnerEnd() {
    return Object.assign(runner(), { end: '2018-05-14T15:17:21.631Z', failures: 0, _duration: 2730 })
}
