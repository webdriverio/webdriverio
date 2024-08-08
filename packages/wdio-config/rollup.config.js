import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'

import { getRollupConfig, getExternal } from '../../scripts/rollup.config.js'
import pkg from './package.json' assert { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const external = getExternal(pkg)

/** @type {import('rollup').RollupOptions} */
export default defineConfig([
    ...getRollupConfig(__dirname, pkg),
    {
        input: path.resolve(__dirname, 'src', 'node', 'index.ts'),
        output: {
            file: path.resolve(__dirname, 'build', 'node.js'),
            format: 'es'
        },
        external,
        plugins: [esbuild({ target: 'node18' })],
    },
    {
        input: path.resolve(__dirname, 'src', 'node', 'index.ts'),
        output: {
            file: path.resolve(__dirname, 'build', 'node.d.ts'),
            format: 'es'
        },
        external,
        plugins: [dts({ respectExternal: true })],
    }
])
