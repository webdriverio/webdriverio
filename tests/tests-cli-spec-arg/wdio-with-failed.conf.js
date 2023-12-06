import { config as baseConfig } from './base.wdio.conf.js'

export const config = Object.assign(
    baseConfig,
    {
        /**
         * specify test files
         */
        specs:
        [
            './mocha.test01.js',
            './mocha.test02.js',
            './mocha.test03.js',
            './jestFail.test.js',
            [
                './mocha.test04.js',
                './jestFail.test.js'
            ]
        ],
    }
)