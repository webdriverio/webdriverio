import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    baseURL: process.env.STAGING === '1'
        ? 'http://staging.example.test/'
        : 'http://example.test/',
    // ...
})