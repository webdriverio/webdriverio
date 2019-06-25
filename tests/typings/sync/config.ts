const conf: WebdriverIO.Config = {
    // can be both array and function
    onComplete: (config, caps) => { },
    onPrepare: [
        () => { }
    ],

    // can be function only
    afterSuite: () => {},
}
