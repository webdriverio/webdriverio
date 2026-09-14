import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    runner: ['browser', {
        // network IP of the machine that runs the WebdriverIO process
        host: 'http://172.168.0.2'
    }]
})