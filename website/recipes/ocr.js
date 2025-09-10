import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    //...
    services: [
        // your other services
        [
            'ocr',
            {
                contrast: 0.25,
                imagesFolder: '.tmp/',
                language: 'eng',
            },
        ],
    ],
})