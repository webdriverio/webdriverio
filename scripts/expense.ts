#!/usr/bin/env node

import fs from 'node:fs'
import crypto from 'node:crypto'
import { Resend } from 'resend'
import { Octokit } from '@octokit/rest'

import Email from './templates/expenseMail.js'

const owner = 'webdriverio'
const repo = 'webdriverio'
const from = 'WebdriverIO Team <sponsor@webdriver.io>'
const bcc = 'expense@webdriver.io'

const TSC_MEMBERS = [
    'abjerstedt',
    'christian-bromann',
    'erwinheitzman',
    'klamping',
    'mgrybyk',
    'WillBrock',
    'wswebcreation'
]

/**
 * create a authentication key for contributor
 */
const randomString = crypto.randomUUID()
const secretKey = crypto.createHash('sha256').update(randomString).digest('hex')

/**
 * check if `GH_TOKEN` environment variable is set to interact with GitHub API
 */
if (!process.env.GH_TOKEN) {
    throw new Error(
        'Please export a "GH_TOKEN" access token to generate the changelog.\n' +
        'See also https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#release-new-version'
    )
}

/**
 * ensure that Resend API key is given
 */
if (!process.env.RESEND_API_KEY) {
    throw new Error('Please export a "RESEND_API_KEY" access token into the environment.')
}

const eventPath = process.env.GITHUB_EVENT_PATH
/**
 * Make sure this script is run from a GitHub Action
 */
if (!eventPath) {
    throw new Error('Please run this script from a GitHub Action!')
}

const eventData = await getEventData(eventPath)
if (!eventData) {
    throw new Error('Could not get event data!')
}

if (!TSC_MEMBERS.includes(eventData.sender.login)) {
    throw new Error(`User ${eventData.sender.login} is not a TSC member and can't grant expenses!`)
}

const expenseAmount = eventData.label.name.split(' ')[1]?.slice(1)
if (!expenseAmount) {
    throw new Error(`Could not find expense amount. Please make sure to attach an expense label to PR #${eventData.pull_request.number}`)
}

const api = new Octokit({ auth: process.env.GH_TOKEN })
const commits = await api.pulls.listCommits({
    owner,
    repo,
    pull_number: eventData.pull_request.number
})
const pr = await api.pulls.get({
    owner: 'webdriverio',
    repo: 'webdriverio',
    pull_number: eventData.pull_request.number
})

/**
 * currently we only support one author per PR, so the person
 * who makes the first commit receives the funds
 */
const prAuthors = new Set(commits.data.map((commit) => commit.commit.author?.email).filter(Boolean))
if (prAuthors.size > 1) {
    throw new Error('Pull request contains commits from multiple authors!')
}
const prAuthorEmail = prAuthors.values().next().value

const resend = new Resend(process.env.RESEND_API_KEY)
const subject = 'Thank you for contributing to WebdriverIO!'
const data = await resend.emails.send({
    from,
    to: prAuthorEmail,
    bcc,
    subject,
    text: subject,
    react: Email({
        username: pr.data.user.login,
        prNumber: eventData.pull_request.number,
        prURL: `https://github.com/${owner}/${repo}/pull/${eventData.pull_request.number}`,
        expenseAmount: parseInt(expenseAmount, 10),
        secretKey
    })
})

if (data.error) {
    throw new Error(`Could not send email: ${data.error}`)
}

/**
 * Add a comment to the PR that an expense email has been sent out
 */
await api.issues.createComment({
    owner,
    repo,
    issue_number: eventData.pull_request.number,
    body: `Hey ${pr.data.user.login} 👋

Thank you for your contribution to WebdriverIO! Your pull request has been marked as an "Expensable" contribution.
We've sent you an email with further instructions on how to claim your expenses from our development fund. Please
make sure to check your spam folder as well. If you have any questions, feel free to reach out to us at __expense@webdriver.io__
or in the contributing channel on [Discord](https://discord.webdriver.io).

We are looking forward to more contributions from you in the future 🙌

Have a nice day,
The WebdriverIO Team 🤖`
})

async function getEventData (eventPath: string) {
    try {
        const ev = JSON.parse(await fs.readFileSync(eventPath, 'utf8'))
        return ev
    } catch (err) {
        return null
    }
}
