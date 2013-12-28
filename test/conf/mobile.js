module.exports = {
    host: '127.0.0.1',
    port: 4723,
    logLevel: 'silent',
    desiredCapabilities: {
        browserName: '',
        version: '7.1',
        'device-orientation': 'portrait',
        app: 'http://localhost:8080/site.zip',
        device: 'iPhone Simulator'
    }
};