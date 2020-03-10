const config: WebdriverIOAsync.Config = {
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
