import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
})