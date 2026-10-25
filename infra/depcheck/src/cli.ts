#!/usr/bin/env node

import { checkDependencies, formatBrokenPackages, findUntrackedPeers, formatUntrackedPeers, readWorkspaceManifests } from './index.js'

const brokenPackages = await checkDependencies()
const untrackedPeers = findUntrackedPeers(readWorkspaceManifests())

if (brokenPackages.length) {
    console.log(formatBrokenPackages(brokenPackages))
}
if (untrackedPeers.length) {
    console.log(formatUntrackedPeers(untrackedPeers))
}
if (brokenPackages.length || untrackedPeers.length) {
    process.exit(1)
}

console.log('Depcheck passed!')
process.exit(0)
