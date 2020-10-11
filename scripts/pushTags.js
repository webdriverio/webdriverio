#!/usr/bin/env node
/**
 * It seems that Lerna doesn't publish annotated tags to GitHub
 * after the release. This script is a little helper to ensure
 * this happens.
 */
const shell = require('shelljs')

const { version } = require('../lerna.json')

console.log('\nPushing release tag...')
shell.exec(`git push origin refs/tags/v${version} -f --no-verify`)
