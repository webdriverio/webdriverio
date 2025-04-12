import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    services: [
        [
            'visual',
            {
                enableLayoutTesting: true
            }
        ]
    ]
    // ...
})