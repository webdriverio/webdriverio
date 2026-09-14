
import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    capabilities: {
        chromeBrowserOne: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['disable-infobars'],
                },
                // THIS!!!
                'wdio-ics:options': {
                    logName: 'chrome-latest-one',
                },
            },
        },
        chromeBrowserTwo: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['disable-infobars'],
                },
                // THIS!!!
                'wdio-ics:options': {
                    logName: 'chrome-latest-two',
                },
            },
        },
    },
})