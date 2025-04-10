import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub',
    // ...
})