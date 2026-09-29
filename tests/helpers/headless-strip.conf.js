import { config as headlessConfig } from './headless.conf.js'

export const config = Object.assign({}, headlessConfig, {
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--headless=new', '--disable-gpu']
        }
    }]
})
