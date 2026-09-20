#!/usr/bin/env node

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { Readable } from 'node:stream'

import unzipper, { type Entry } from 'unzipper'
import { Octokit } from '@octokit/rest'

import { MAIN_BRANCH, MAX_ARTIFACT_PAGES, SPEC_OWNER, SPEC_REPO } from './constants.js'
import { validateZipEntryPath } from './utils.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export interface DownloadSpecOptions {
    targetDir?: string
    auth?: string
    page?: number
}

export default async function downloadSpec (pageOrOptions: number | DownloadSpecOptions = 1) {
    const options: DownloadSpecOptions = typeof pageOrOptions === 'number'
        ? { page: pageOrOptions }
        : pageOrOptions
    const page = options.page ?? 1
    const targetDir = options.targetDir ?? path.join(__dirname, 'cddl')
    const zipPath = path.join(targetDir, 'cddl.zip')
    await fsp.rm(targetDir, { recursive: true, force: true })
    await fsp.mkdir(targetDir)

    /**
     * check if `GITHUB_AUTH` environment variable is set to interact with GitHub API
     */
    const auth = options.auth ?? process.env.GITHUB_AUTH
    if (!auth) {
        throw new Error('Please export a "GITHUB_AUTH" access token to access GitHub.')
    }

    const owner = SPEC_OWNER
    const repo = SPEC_REPO
    const api = new Octokit({ auth })
    const artifacts = await api.rest.actions.listArtifactsForRepo({
        owner,
        repo,
        page,
        per_page: 100
    }).catch((error) => {
        console.log(`Failed to download spec file: ${error.message}`)
    })

    if (!artifacts || artifacts.data.artifacts.length === 0) {
        return false
    }

    // eslint-disable-next-line camelcase
    const cddlBuilds = artifacts.data.artifacts.filter(({ name, workflow_run }) => (
        name === 'cddl' &&
        // eslint-disable-next-line camelcase
        workflow_run && workflow_run.head_branch === MAIN_BRANCH
    ))

    if (page > MAX_ARTIFACT_PAGES) {
        return false
    }

    if (cddlBuilds.length === 0) {
        return downloadSpec({ ...options, page: page + 1, targetDir, auth })
    }

    console.log(`Downloading CDDL artifact from ${cddlBuilds[0].created_at}`)
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
        // Validate the entry path to prevent directory traversal attacks
        const unzippedFilePath = validateZipEntryPath(entry.path, targetDir)
        if (!unzippedFilePath) {
            // Skip entries with invalid paths
            entry.autodrain()
            return
        }

        if (entry.type === 'Directory') {
            return
        }

        if (!await fsp.access(path.dirname(unzippedFilePath)).then(() => true, () => false)) {
            await fsp.mkdir(path.dirname(unzippedFilePath), { recursive: true })
        }

        const execStream = entry.pipe(fs.createWriteStream(unzippedFilePath))
        console.log(`Downloading CDDL artifact to ${unzippedFilePath}`)
        promiseChain.push(new Promise((resolve, reject) => {
            execStream.on('close', () => resolve(unzippedFilePath))
            execStream.on('error', reject)
        }))
    })

    await Promise.all(promiseChain)
    await fsp.unlink(zipPath)
    return true
}
