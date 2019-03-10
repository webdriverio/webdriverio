const runner =  () => ({
    type: 'runner',
    start: '2018-05-14T15:17:18.901Z',
    _duration: 0,
    cid: '0-0',
    capabilities: { foo: 'bar' },
    sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
    config: { capabilities: { browserName: 'chrome', version: '68' } },
    specs: ['/tmp/user/spec.js']
})

export function runnerStart() {
    return Object.assign(runner())
}

export function runnerEnd() {
    return Object.assign(runner(), { end: '2018-05-14T15:17:21.631Z', failures: 0, _duration: 2730 })
}
