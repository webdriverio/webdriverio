import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    services: [['electron', {
        appEntryPoint: './path/to/bundled/electron/main.bundle.js',
        appArgs: [/** ... */],
    }]]
})