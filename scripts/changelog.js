#!/usr/bin/env node

/**
 * script to auto update CHANGELOG.md file
 */
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import chalk from 'chalk'
import shell from 'shelljs'
import { Octokit } from '@octokit/rest'
import { highlight } from 'cli-highlight'
import { Changelog } from 'lerna-changelog'
import { load } from 'lerna-changelog/lib/configuration'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const { version } = await import(path.join(root, 'lerna.json'))
const changelogPath = path.join(root, 'CHANGELOG.md')

if (!process.env.GITHUB_AUTH) {
    shell.exec('git checkout -- .')
    throw new Error(
        'Please export a "GITHUB_AUTH" access token to generate the changelog.\n' +
        'See also https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#release-new-version'
    )
}

const config = load({ nextVersionFromMetadata: false })
config.nextVersion = version
const changelog = new Changelog(config)

/**
 * update local tags
 */
shell.exec('git fetch --tags --force')
const latestRelease = shell.exec('git describe --abbrev=0 --tags').stdout.trim()
const BANNER = `
#######################
###                 ###
###    CHANGELOG    ###
###                 ###
#######################`

const api = new Octokit({ auth: process.env.GITHUB_AUTH })

/**
 * in case the error check above doesn't has any effect and a release
 * was made without updating changelogs, just put
 *
 * `{ tagFrom: 'v5.7.12' }`
 *
 * as parameter into `createMarkdown` and set the version from which
 * a release was made (the older version).
 */
// eslint-disable-next-line no-console
console.log('Start generating changelog...')
changelog.createMarkdown({ tagFrom: `${latestRelease}` }).then((newChangelog) => {
    const changes = newChangelog.slice(newChangelog.indexOf('('))

    if (changes.trim().length === 0) {
        console.log('No changelog detected, skipping!')
        return 'No updates!'
    }

    newChangelog = `## v${version} ${changes}\n`
    let changelogContent = fs.readFileSync(changelogPath, 'utf8')
    changelogContent = changelogContent.replace('---', '---\n\n' + newChangelog)
    fs.writeFileSync(changelogPath, changelogContent, 'utf8')

    /**
     * print changelog
     */
    const highlighted = highlight(newChangelog, {
        language: 'Markdown',
        theme: {
            section: chalk.bold,
            string: chalk.hex('#0366d6'),
            link: chalk.dim
        }
    })

    // eslint-disable-next-line no-console
    console.log(BANNER)
    // eslint-disable-next-line no-console
    console.log(highlighted, '\n\n')
    return newChangelog
}, (err) => {
    console.error(err)
    process.exit(1)
}).then(
    /**
     * make GitHub release for machine readable changelog
     */
    (releaseBody) => api.repos.createRelease({
        owner: 'webdriverio',
        repo: 'webdriverio',
        tag_name: `v${version}`,
        name: `v${version}`,
        body: releaseBody
    })
)
