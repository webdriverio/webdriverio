import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'

import { getRollupConfig, getExternal } from '../../scripts/rollup.config.js'
import pkg from './package.json' assert { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const external = getExternal(pkg)

/** @type {import('rollup').RollupOptions} */
export default defineConfig([
    ...getRollupConfig(__dirname, pkg),
    ...['driver', 'mock', 'setup', 'spy', 'expect'].map((name) => ({
        input: path.resolve(__dirname, 'src', 'browser', `${name}.ts`),
        output: {
            file: path.resolve(__dirname, 'build', 'browser', `${name}.js`),
            format: 'es'
        },
        external,
        plugins: [
            esbuild({ target: ['esnext', 'chrome90', 'edge90', 'firefox90', 'safari15'] }),
        ]
    }))
])
