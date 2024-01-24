#!/usr/bin/env node

import crypto from 'node:crypto'
import { Resend } from 'resend'
import { Octokit } from '@octokit/rest'

import Email from './templates/expenseMail.js'

const owner = 'webdriverio'
const repo = 'webdriverio'
const from = 'WebdriverIO Team <sponsor@webdriver.io>'
const bcc = 'expense@webdriver.io'

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
 * make sure `AMOUNT` and `PR_NUMBER` environment variables are set
 */
if (!process.env.AMOUNT) {
    throw new Error('Please export an "AMOUNT" environment variable.')
}
if (!process.env.PR_NUMBER) {
    throw new Error('Please export a "PR_NUMBER" environment variable.')
}

/**
 * ensure that Resend API key is given
 */
if (!process.env.RESEND_API_KEY) {
    throw new Error('Please export a "RESEND_API_KEY" access token into the environment.')
}

const prNumber = parseInt(process.env.PR_NUMBER, 10)
const expenseAmount = parseInt(process.env.AMOUNT, 10)
const prURL = `https://github.com/${owner}/${repo}/pull/${prNumber}`

const api = new Octokit({ auth: process.env.GH_TOKEN })
const commits = await api.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber
})
const pr = await api.pulls.get({
    owner: 'webdriverio',
    repo: 'webdriverio',
    pull_number: prNumber
})

if (pr.data.labels.find((label) => label.name.includes('Expensable'))) {
    throw new Error('Pull request has already been expensed!')
}

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
        prNumber,
        prURL,
        expenseAmount,
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
    issue_number: prNumber,
    body: `Hey __${pr.data.user.login}__ 👋

Thank you for your contribution to WebdriverIO! Your pull request has been marked as an "Expensable" contribution.
We've sent you an email with further instructions on how to claim your expenses from our development fund. Please
make sure to check your spam folder as well. If you have any questions, feel free to reach out to us at __expense@webdriver.io__
or in the contributing channel on [Discord](https://discord.webdriver.io).

We are looking forward to more contributions from you in the future 🙌

Have a nice day,
The WebdriverIO Team 🤖`
})

await api.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [`Expensable $${expenseAmount} 💸`]
})
