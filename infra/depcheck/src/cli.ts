#!/usr/bin/env node

import { checkDependencies, formatBrokenPackages } from './index.js'
import { checkDependencyEngines, formatBrokenEngines } from './engines.js'

const brokenPackages = await checkDependencies()
const brokenEngines = checkDependencyEngines()

if (brokenPackages.length || brokenEngines.length) {
    console.log(formatBrokenPackages(brokenPackages))
    if (brokenEngines.length) {
        console.log(formatBrokenEngines(brokenEngines))
    }
    process.exit(1)
}

console.log('Depcheck passed!')
process.exit(0)
