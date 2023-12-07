import { config as baseConfig } from './base.wdio.conf.js'
import url from 'node:url'
import path from 'node:path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const outputDirPath = path.resolve(__dirname, 'logs')

export const config = Object.assign(
    baseConfig,
    {
        /**
         * specify test files
         */
        specs:
        [
            './mocha.test01.js',
            [
                './mocha.test02.js',
                './mocha.test03.js'
            ],
            [
                './mocha.test04.js'
            ]
        ],
        outputDir: outputDirPath
    }
)