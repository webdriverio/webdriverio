#!/usr/bin/env node

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { Readable } from 'node:stream'

import unzipper, { type Entry } from 'unzipper'
import { Octokit } from '@octokit/rest'

const MAIN_BRANCH = 'master'

export default async function downloadSpec () {
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
    const targetDir = path.join(__dirname, 'cddl')
    const zipPath = path.join(targetDir, 'cddl.zip')
    await fsp.rm(targetDir, { recursive: true, force: true })
    await fsp.mkdir(targetDir)

    /**
     * check if `GITHUB_AUTH` environment variable is set to interact with GitHub API
     */
    if (!process.env.GITHUB_AUTH) {
        throw new Error('Please export a "GITHUB_AUTH" access token to access GitHub.')
    }

    const owner = 'w3c'
    const repo = 'webdriver-bidi'
    const api = new Octokit({ auth: process.env.GITHUB_AUTH })
    const artifacts = await api.rest.actions.listArtifactsForRepo({
        owner,
        repo,
    })
    // eslint-disable-next-line camelcase
    const cddlBuilds = artifacts.data.artifacts.filter(({ name, workflow_run }) => (
        name === 'cddl' &&
        // eslint-disable-next-line camelcase
        workflow_run && workflow_run.head_branch === MAIN_BRANCH
    ))

    const { data } = await api.rest.actions.downloadArtifact({
        owner,
        repo,
        artifact_id: cddlBuilds[0].id,
        archive_format: 'zip',
    }) as { data: Uint8Array }

    await fsp.writeFile(zipPath, Buffer.from(data))

    const stream = Readable.from(fs.createReadStream(zipPath)).pipe(unzipper.Parse())
    const promiseChain: Promise<string | void>[] = [
        new Promise((resolve, reject) => {
            stream.on('close', () => resolve())
            stream.on('error', () => reject())
        })
    ]

    stream.on('entry', async (entry: Entry) => {
        const unzippedFilePath = path.join(targetDir, entry.path)
        if (entry.type === 'Directory') {
            return
        }

        if (!await fsp.access(path.dirname(unzippedFilePath)).then(() => true, () => false)) {
            await fsp.mkdir(path.dirname(unzippedFilePath), { recursive: true })
        }

        const execStream = entry.pipe(fs.createWriteStream(unzippedFilePath))
        promiseChain.push(new Promise((resolve, reject) => {
            execStream.on('close', () => resolve(unzippedFilePath))
            execStream.on('error', reject)
        }))
    })

    await Promise.all(promiseChain)
    await fsp.unlink(zipPath)

}
