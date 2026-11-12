import logger from '@wdio/logger'
import topLevelAwait from 'vite-plugin-top-level-await'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import type { InlineConfig } from 'vite'

import { codeFrameFix, pathPolyfill } from './plugins/esbuild.js'
import type { FrameworkPreset } from '../types.js'

const log = logger('@wdio/browser-runner:vite')

export const DEFAULT_PROTOCOL = 'http'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_HOST = `${DEFAULT_PROTOCOL}://${DEFAULT_HOSTNAME}`
export const PRESET_DEPENDENCIES: Record<FrameworkPreset, [string, string, unknown] | undefined> = {
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
            '@wdio/browser-runner > expect',
            '@wdio/browser-runner > expect > jest-util',
            '@wdio/browser-runner > expect > jest-matcher-utils',
            '@wdio/browser-runner > deepmerge-ts',
            '@wdio/browser-runner > webdriver > ws',
            '@wdio/browser-runner > @wdio/utils > split2',
            '@wdio/browser-runner > @wdio/utils > aria-query',
            '@wdio/browser-runner > webdriverio > css-shorthand-properties',
            '@wdio/browser-runner > webdriverio > lodash.clonedeep',
            '@wdio/browser-runner > webdriverio > aria-query',
            '@wdio/browser-runner > webdriverio > grapheme-splitter',
            '@wdio/browser-runner > webdriverio > css-value',
            '@wdio/browser-runner > webdriverio > rgb2hex'
        ],
        esbuildOptions: {
            logLevel: 'silent',
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis',
                // jest-message-util >= 30.5 reads `__dirname` when it loads
                __dirname: '"/"',
            },
            // Enable esbuild polyfill plugins
            plugins: [
                esbuildCommonjs(['@testing-library/vue']),
                /**
                 * cast to "any" here as Vite's esbuild dependency and WebdriverIOs one
                 * may differ and cause type issues here.
                 */
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                codeFrameFix() as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pathPolyfill() as any
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
