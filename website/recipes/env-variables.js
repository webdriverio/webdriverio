import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
})

if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}