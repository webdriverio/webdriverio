import logger from '@wdio/logger'
import topLevelAwait from 'vite-plugin-top-level-await'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import type { InlineConfig } from 'vite'

import { codeFrameFix } from './plugins/esbuild.js'
import type { FrameworkPreset } from '../types.js'

const log = logger('@wdio/browser-runner:vite')

export const DEFAULT_PROTOCOL = 'http'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_HOST = `${DEFAULT_PROTOCOL}://${DEFAULT_HOSTNAME}`
export const PRESET_DEPENDENCIES: Record<FrameworkPreset, [string, string, any] | undefined> = {
    react: ['@vitejs/plugin-react', 'default', {
        babel: {
            assumptions: {
                setPublicClassFields: true
            },
            parserOpts: {
                plugins: ['decorators-legacy', 'classProperties']
            }
        }
    }],
    preact: ['@preact/preset-vite', 'default', undefined],
    vue: ['@vitejs/plugin-vue', 'default', undefined],
    svelte: ['@sveltejs/vite-plugin-svelte', 'svelte', undefined],
    solid: ['vite-plugin-solid', 'default', undefined],
    stencil: undefined,
    lit: undefined
}

export const DEFAULT_VITE_CONFIG: Partial<InlineConfig> = {
    configFile: false,
    server: { host: DEFAULT_HOSTNAME },
    logLevel: 'info',
    plugins: [topLevelAwait()],
    build: {
        sourcemap: 'inline',
        commonjsOptions: {
            include: [/node_modules/],
        }
    },
    optimizeDeps: {
        /**
         * the following deps are CJS packages and need to be optimized (compiled to ESM) by Vite
         */
        include: [
            'expect', 'minimatch', 'css-shorthand-properties', 'lodash.merge', 'lodash.zip', 'ws',
            'lodash.clonedeep', 'lodash.pickby', 'lodash.flattendeep', 'aria-query', 'grapheme-splitter',
            'css-value', 'rgb2hex', 'p-iteration', 'deepmerge-ts', 'jest-util', 'jest-matcher-utils', 'split2'
        ],
        esbuildOptions: {
            logLevel: 'silent',
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis',
            },
            // Enable esbuild polyfill plugins
            plugins: [
                esbuildCommonjs(['@testing-library/vue']),
                codeFrameFix()
            ],
        },
    },
    customLogger: {
        info: (msg: string) => log.info(msg),
        warn: (msg: string) => log.warn(msg),
        warnOnce: (msg: string) => log.warn(msg),
        error: (msg: string) => log.error(msg),
        clearScreen: () => {},
        hasErrorLogged: () => false,
        hasWarned: false
    }
}
