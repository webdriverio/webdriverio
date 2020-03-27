const config: WebdriverIO.Config = {
    services: [
        ['browserstack', {
            browserstackLocal: true,
            forcedStop: false,
            opts: {
                folder: 'foo',
                forceLocal: true,
                logFile: 'bar'
            }
        }]
    ]
}

export default {}
