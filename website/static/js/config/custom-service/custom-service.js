import { defineConfig } from '@wdio/config'
import CustomService from './service/my.custom.service'

export const config = defineConfig({
    // ...
    services: [
        /**
         * use imported service class
         */
        [CustomService, {
            someOption: true
        }],
        /**
         * use absolute path to service
         */
        ['/path/to/service.js', {
            someOption: true
        }]
    ],
    // ...
})