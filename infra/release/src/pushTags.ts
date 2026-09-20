#!/usr/bin/env node
/**
 * It seems that Lerna doesn't publish annotated tags to GitHub
 * after the release. This script is a little helper to ensure
 * this happens.
 */
import path from 'node:path'
import shell from 'shelljs'
import { getRootDir } from '@wdio/repo-utils'

export function getPushTagCommand(version: string) {
    return `git push origin refs/tags/v${version} -f --no-verify`
}

export async function pushReleaseTag (rootDir = getRootDir()) {
    const pkg = (await import(new URL(`file://${path.join(rootDir, 'lerna.json')}`).href, { with: { type: 'json' } })).default
    const command = getPushTagCommand(pkg.version)
    console.log('\nPushing release tag...')
    shell.exec(command)
}

