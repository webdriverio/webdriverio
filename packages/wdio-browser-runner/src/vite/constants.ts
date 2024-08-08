import topLevelAwait from 'vite-plugin-top-level-await'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import type { InlineConfig } from 'vite'

import { codeFrameFix } from './plugins/esbuild.js'
import type { FrameworkPreset } from '../types.js'

export const DEFAULT_HOSTNAME = '0.0.0.0'
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
    logLevel: 'silent',
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
            'css-value', 'rgb2hex', 'p-iteration', 'deepmerge-ts', 'jest-util', 'jest-matcher-utils', 'split2',
            'jszip'
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
    }
}
