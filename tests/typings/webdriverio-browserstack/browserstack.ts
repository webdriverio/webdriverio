const config: WebdriverIO.Config = {
    specs: [],
    browserstackLocal: true,
    browserstackLocalForcedStop: false,
    browserstackOpts: {
        folder: 'foo',
        forceLocal: true,
        logFile: 'bar',
        'foo': 'bar'
    }
}

export default {}
