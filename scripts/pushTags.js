#!/usr/bin/env node

/**
 * It seems that Lerna doesn't publish annotated tags to GitHub
 * after the release. This script is a little helper to ensure
 * this happens.
 */

import { execSync } from 'node:child_process'

import pkg from '../lerna.json' assert { type: 'json' }

console.log('\nPushing release tag...')

execSync(`git push origin refs/tags/v${pkg.version} -f --no-verify`)
