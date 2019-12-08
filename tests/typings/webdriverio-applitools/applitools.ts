const config: WebdriverIO.Config = {
<<<<<<< Updated upstream
    applitools: {
        key: '',
        serverUrl: '',
=======
    applitoolsKey: '',
    applitoolsServerUrl: '',
    applitools: {
>>>>>>> Stashed changes
        viewport: {
            width: 1,
            height: 1
        }
    }
}

async function bar() {
    await browser.takeSnapshot('title');
    await browser.takeRegionSnapshot('title', {
        top: 1,
        left: 1,
        width: 1,
        height: 1
    });
}

export default {}
