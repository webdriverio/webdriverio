import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'rollup'

import { getRollupConfig } from '../../scripts/rollup.config.js'
import pkg from './package.json' assert { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/** @type {import('rollup').RollupOptions} */
export default defineConfig(getRollupConfig(__dirname, pkg))
