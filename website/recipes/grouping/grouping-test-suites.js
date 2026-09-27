import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    'specs': [
        'tests/general/**/*.js'
    ],
    'capabilities': [
        {
            platformName: 'Android',
            'wdio:specs': ['tests/android/**/*.js'],
            //...
        },
        {
            platformName: 'iOS',
            'wdio:specs': ['tests/ios/**/*.js'],
            //...
        },
        {
            platformName: 'Chrome',
            //config level specs will be used
        }
    ]
})