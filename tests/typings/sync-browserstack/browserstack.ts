import WebdriverIO from 'webdriverio'

const config: WebdriverIO.Config = {
    browserstackLocal: true,
    forcedStop: false,
    opts: {
        folder: 'foo',
        forceLocal: true,
        logFile: 'bar',
        'foo': 'bar'
    }
}

export default {}
