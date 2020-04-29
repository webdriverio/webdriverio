const config: WebdriverIO.Config = {
    services: [
        ['sauce', {
            sauceConnect: true,
            sauceConnectOpts: {
                verbose: true,
                connectRetries: 123
            },
            scRelay: true,
            setJobNameInBeforeSuite: true
        }]
    ]
}

export default { config }
