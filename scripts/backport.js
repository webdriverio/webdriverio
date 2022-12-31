#!/usr/bin/env node

import Octokit from '@octokit/rest'
import inquirer from 'inquirer'
import shell from 'shelljs'

const activeLTSVersion = 'v6'
const maintenanceLTSVersion = 'v5'

/**
 * check if `GITHUB_AUTH` environment variable is set to interact with GitHub API
 */
if (!process.env.GITHUB_AUTH) {
    throw new Error(
        'Please export a "GITHUB_AUTH" access token to generate the changelog.\n' +
        'See also https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#release-new-version'
    )
}

/**
 * check if user is in right branch
 */
const { stdout: branch } = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true })
if (branch.trim() !== maintenanceLTSVersion) {
    throw new Error(
        'In order to start backport process witch to the maintenance LTS branch via:\n' +
        `$ git checkout ${maintenanceLTSVersion}`
    )
}

function getPrompt (pr) {
    return [{
        name: 'toBackport',
        type: 'confirm',
        default: true,
        message: `You want to backport "${pr.title}" by ${pr.user.login}?\n(See PR ${pr.html_url})`
    }, {
        name: 'exit',
        type: 'confirm',
        default: false,
        message: 'Exit process?',
        when: ({ toBackport }) => !toBackport
    }]
}

const api = new Octokit({ auth: process.env.GITHUB_AUTH })

/* eslint-disable no-console */
;(async () => {
    let backportedPRs = 0

    const prs = await api.pulls.list({
        owner: 'webdriverio',
        repo: 'webdriverio',
        state: 'closed',
        sort: 'created',
        direction: 'desc'
    })
    const prsToBackport = prs.data.filter((pr) => (
        pr.labels.find(
            (label) => label.name === 'backport-requested'
        ) &&
        Boolean(pr.merged_at)
    )).reverse()

    if (prsToBackport.length === 0) {
        console.log('Nothing to backport!')
        return backportedPRs
    }

    for (const prToBackport of prsToBackport) {
        const { toBackport, exit } = await inquirer.prompt(getPrompt(prToBackport))

        if (exit) {
            return backportedPRs
        }

        if (!toBackport) {
            continue
        }

        console.log(`Backporting sha ${prToBackport.merge_commit_sha} from ${activeLTSVersion} to ${maintenanceLTSVersion}`)
        const cherryPickResult = shell.exec(`git cherry-pick ${prToBackport.merge_commit_sha}`)

        /**
         * handle failing cherry-pick
         */
        if (cherryPickResult.stderr) {
            const { exit } = await inquirer.prompt([{
                name: 'exit',
                type: 'confirm',
                default: true,
                message: 'Oh oh! Something failed with backporting, do you want to exit to check that?'
            }])

            if (exit) {
                return backportedPRs
            }

            console.log('Ignoring error, continuing backporting...')
            continue
        }

        /**
         * switch labels
         */
        await api.issues.removeLabel({
            owner: 'webdriverio',
            repo: 'webdriverio',
            issue_number: prToBackport.number,
            name: 'backport-requested'
        })
        await api.issues.addLabels({
            owner: 'webdriverio',
            repo: 'webdriverio',
            issue_number: prToBackport.number,
            labels: ['backported']
        })

        ++backportedPRs
    }

    return backportedPRs
})().then(
    (amount) => console.log(amount
        ? (
            `\nSuccessfully backported ${amount} PRs 👏!\n` +
            `Please now push them to v6 and make a new ${maintenanceLTSVersion}.x release!`
        )
        : 'Bye!'
    ),
    (err) => console.error(`Error backporting: ${err.stack}`)
)
