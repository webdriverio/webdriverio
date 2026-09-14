import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    capabilities: [{
        browserName: 'chrome',
        // ...
        proxy: {
            proxyType: 'manual',
            httpProxy: 'corporate.proxy:8080',
            socksUsername: 'codeceptjs',
            socksPassword: 'secret',
            noProxy: '127.0.0.1,localhost'
        },
        // ...
    }],
    // ...
})