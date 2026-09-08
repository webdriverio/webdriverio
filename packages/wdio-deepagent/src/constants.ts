import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const VERSION = require('../package.json').version as string
