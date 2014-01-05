module.exports = {
    desiredCapabilities: {
        browserName: process.env._BROWSER || '',
        platform: (process.env._PLATFORM || '').replace(/_/g,' '),
        device: (process.env._DEVICE || '').replace(/_/g,' '),
        app: process.env._APP || '',
        // app: 'sauce-storage:site.zip',
        // app: 'http://localhost:8080/test/site.zip',
    }
};