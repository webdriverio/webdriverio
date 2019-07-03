#!/usr/bin/env node

/**
 * script to auto update CHANGELOG.md file
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { highlight } = require('cli-highlight')
const { Changelog } = require('lerna-changelog')
const { load } = require('lerna-changelog/lib/configuration')

const root = path.resolve(__dirname, '..')
const { version } = require(path.join(root, 'lerna.json'))
const changelogPath = path.join(root, 'CHANGELOG.md')

if (!process.env.GITHUB_AUTH) {
    shell.exec('git checkout -- .')
    throw new Error(
        'Please export a "GITHUB_AUTH" access token to generate the changelog.\n' +
        'See also https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md#release-new-version'
    )
}

const config = load({ nextVersionFromMetadata: false })
config.nextVersion = version
const changelog = new Changelog(config)

const BANNER = `
#######################
###                 ###
###    CHANGELOG    ###
###                 ###
#######################`

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
changelog.createMarkdown({ tagFrom: 'v5.10.9' }).then((newChangelog) => {
    let changelogContent = fs.readFileSync(changelogPath, 'utf8')
    changelogContent = changelogContent.replace('---', '---\n' + newChangelog)
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
})
