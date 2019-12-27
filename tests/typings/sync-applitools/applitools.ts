const config: WebdriverIO.Config = {
    applitools: {
        key: '',
        serverUrl: '',
        viewport: {
            width: 1,
            height: 1
        }
    }
}

browser.takeSnapshot('title');
browser.takeRegionSnapshot('title', {
    top: 1,
    left: 1,
    width: 1,
    height: 1
  });

export default {}
