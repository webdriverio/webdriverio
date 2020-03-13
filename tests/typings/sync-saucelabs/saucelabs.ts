const config: WebdriverIO.Config = {
    services: [
        ['sauce', {
            sauceConnect: true,
            sauceConnectOpts: {},
            scRelay: true
        }]
    ]
}

export default { config }
