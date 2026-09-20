#!/usr/bin/env node
/// <reference types="../../../@types/lerna-changelog.d.ts" />

/**
 * script to auto update CHANGELOG.md file
 */
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import shell from 'shelljs'
import { Octokit } from '@octokit/rest'
import { highlight } from 'cli-highlight'
import { Changelog } from 'lerna-changelog'
import { load } from 'lerna-changelog/lib/configuration.js'
import { getRootDir } from '@wdio/repo-utils'

const BANNER = `
#######################
###                 ###
###    CHANGELOG    ###
###                 ###
#######################`

export function formatChangelogEntry(newChangelog: string, version: string) {
    const changes = newChangelog.slice(newChangelog.indexOf('('))
    if (changes.trim().length === 0) {
        return
    }
    return `## v${version} ${changes}\n`
}

export function insertChangelog(existing: string, entry: string) {
    return existing.replace('---', '---\n\n' + entry)
}

export function highlightChangelog(entry: string) {
    return highlight(entry, {
        language: 'Markdown',
        theme: {
            section: chalk.bold,
            string: chalk.hex('#0366d6'),
            link: chalk.dim
        }
    })
}

export interface ChangelogOptions {
    rootDir?: string
    auth?: string
    version?: string
}

export async function generateChangelog (options: ChangelogOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const auth = options.auth ?? process.env.GITHUB_AUTH
    const changelogPath = path.join(rootDir, 'CHANGELOG.md')
    const pkg = options.version
        ? { version: options.version }
        : (await import(new URL(`file://${path.join(rootDir, 'lerna.json')}`).href, { with: { type: 'json' } })).default

    if (!auth) {
        shell.exec('git checkout -- .')
        throw new Error(
            'Please export a "GITHUB_AUTH" access token to generate the changelog.\n' +
            'See also https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#release-new-version'
        )
    }

    const config = load({ nextVersionFromMetadata: false })
    config.nextVersion = pkg.version
    const changelog = new Changelog(config)

    /**
     * update local tags
     */
    shell.exec('git fetch --tags --force')
    const latestRelease = shell.exec('git describe --abbrev=0 --tags').stdout.trim()

    const api = new Octokit({ auth })

    /**
     * in case the error check above doesn't has any effect and a release
     * was made without updating changelogs, just put
     *
     * `{ tagFrom: 'v5.7.12' }`
     *
     * as parameter into `createMarkdown` and set the version from which
     * a release was made (the older version).
     */
    console.log('Start generating changelog...')
    const newChangelog = await changelog.createMarkdown({ tagFrom: `${latestRelease}` }).catch((err: Error) => {
        console.error(err)
        process.exit(1)
    })

    const entry = formatChangelogEntry(newChangelog, pkg.version)
    if (!entry) {
        console.log('No changelog detected, skipping!')
        return 'No updates!'
    }

    const changelogContent = insertChangelog(fs.readFileSync(changelogPath, 'utf8'), entry)
    fs.writeFileSync(changelogPath, changelogContent, 'utf8')

    console.log(BANNER)
    console.log(highlightChangelog(entry), '\n\n')

    /**
     * make GitHub release for machine readable changelog
     */
    await api.repos.createRelease({
        owner: 'webdriverio',
        repo: 'webdriverio',
        tag_name: `v${pkg.version}`,
        name: `v${pkg.version}`,
        body: entry
    })

    return entry
}

