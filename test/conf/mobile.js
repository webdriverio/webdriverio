module.exports = {
    port: 4723,
    desiredCapabilities: {
        browserName: process.env._BROWSER || '',
        platform: process.env._PLATFORM || '',
        device: process.env._DEVICE || '',
        app: process.env._APP || '',
        // app: 'sauce-storage:site.zip',
        // app: 'http://localhost:8080/test/site.zip',
    }
};