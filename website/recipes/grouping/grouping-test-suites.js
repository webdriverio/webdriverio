import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    'specs': [
        'tests/general/**/*.js'
    ],
    'capabilities': [
        {
            platformName: 'Android',
            specs: ['tests/android/**/*.js'],
            //...
        },
        {
            platformName: 'iOS',
            specs: ['tests/ios/**/*.js'],
            //...
        },
        {
            platformName: 'Chrome',
            //config level specs will be used
        }
    ]
})