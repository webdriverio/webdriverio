#!/usr/bin/env node

import { checkDependencies, formatBrokenPackages } from './index.js'

const brokenPackages = await checkDependencies()

if (brokenPackages.length) {
    console.log(formatBrokenPackages(brokenPackages))
    process.exit(1)
}

console.log('Depcheck passed!')
process.exit(0)
