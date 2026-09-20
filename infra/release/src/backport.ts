#!/usr/bin/env node

import { Octokit } from '@octokit/rest'
import inquirer from 'inquirer'
import shell from 'shelljs'

export const activeLTSVersion = 'v6'
export const maintenanceLTSVersion = 'v5'

export interface BackportPullRequest {
    title: string
    user: { login: string } | null
    html_url: string
    labels: { name?: string | undefined }[]
    merged_at: string | null
    merge_commit_sha: string | null
    number: number
}

export function filterPrsToBackport<T extends Pick<BackportPullRequest, 'labels' | 'merged_at'>>(prs: T[]) {
    return prs.filter((pr) => (
        pr.labels.find(
            (label) => label.name === 'backport-requested'
        ) &&
        Boolean(pr.merged_at)
    )).reverse()
}

export function getPrompt (pr: Pick<BackportPullRequest, 'title' | 'user' | 'html_url'>) {
    return [{
        name: 'toBackport',
        type: 'confirm',
        default: true,
        message: `You want to backport "${pr.title}" by ${pr.user?.login || 'unknown user'}?\n(See PR ${pr.html_url})`
    }, {
        name: 'exit',
        type: 'confirm',
        default: false,
        message: 'Exit process?',
        when: ({ toBackport }: { toBackport: boolean }) => !toBackport
    }]
}

export function requireGithubAuth(auth = process.env.GITHUB_AUTH) {
    if (!auth) {
        throw new Error(
            'Please export a "GITHUB_AUTH" access token to generate the changelog.\n' +
            'See also https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#release-new-version'
        )
    }
    return auth
}

export function requireMaintenanceBranch(branch: string) {
    if (branch.trim() !== maintenanceLTSVersion) {
        throw new Error(
            'In order to start backport process witch to the maintenance LTS branch via:\n' +
            `$ git checkout ${maintenanceLTSVersion}`
        )
    }
}

export async function backportPRs () {
    const auth = requireGithubAuth()

    /**
     * check if user is in right branch
     */
    const { stdout: branch } = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true })
    requireMaintenanceBranch(branch)

    const api = new Octokit({ auth })

    let backportedPRs = 0

    const prs = await api.pulls.list({
        owner: 'webdriverio',
        repo: 'webdriverio',
        state: 'closed',
        sort: 'created',
        direction: 'desc'
    })
    const prsToBackport = filterPrsToBackport(prs.data)

    if (prsToBackport.length === 0) {
        console.log('Nothing to backport!')
        return backportedPRs
    }

    for (const prToBackport of prsToBackport) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { toBackport, exit } = await inquirer.prompt(getPrompt(prToBackport) as any)

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
}

