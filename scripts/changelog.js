#!/usr/bin/env node

/**
 * script to auto update CHANGELOG.md file
 */
const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const { highlight } = require('cli-highlight')
const { Changelog } = require('lerna-changelog')
const { load } = require('lerna-changelog/lib/configuration')

const root = path.resolve(__dirname, '..')
const { version } = require(path.join(root,'lerna.json'))
const changelogPath = path.join(root, 'CHANGELOG.md')

const config = load({ nextVersionFromMetadata: false })
config.nextVersion = version
const changelog = new Changelog(config)

const BANNER = `
#######################
###                 ###
###    CHANGELOG    ###
###                 ###
#######################`

// eslint-disable-next-line no-console
console.log('Start generating changelog...')
changelog.createMarkdown({}).then((newChangelog) => {
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
