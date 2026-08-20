#!/usr/bin/env node
/**
 * It seems that Lerna doesn't publish annotated tags to GitHub
 * after the release. This script is a little helper to ensure
 * this happens.
 */
import { spawnSync } from 'node:child_process'

import pkg from '../lerna.json' with { type: 'json' }

const versionRegex = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
if (!versionRegex.test(pkg.version)) {
    throw new Error(`Invalid package version: ${pkg.version}`)
}

console.log('\nPushing release tag...')
const result = spawnSync('git', ['push', 'origin', `refs/tags/v${pkg.version}`, '-f', '--no-verify'], { stdio: 'inherit' })

if (result.status !== 0) {
    process.exit(result.status ?? 1)
}
