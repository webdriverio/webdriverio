import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import unzipper from 'unzipper'
import { Readable } from 'node:stream'

import { Octokit } from '@octokit/rest'

// GitHub repository information
const REPO_OWNER = 'webdriverio'
const REPO_NAME = 'i18n'

const GITHUB_TOKEN = process.env.GITHUB_AUTH
if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_AUTH is not set')
}

const IGNORE_FILES = ['src', 'package.json', 'package-lock.json', 'README.md', 'LICENSE', 'tsconfig.json']

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const octokit = new Octokit({ auth: GITHUB_TOKEN })

export function downloadDocsTranslations() {
    return downloadAndExtractRepo(REPO_OWNER, REPO_NAME)
}

async function downloadAndExtractRepo(owner: string, repo: string, branch?: string) {
    // Step 1: Determine default branch if not specified
    if (!branch) {
        const { data } = await octokit.repos.get({ owner, repo })
        branch = data.default_branch
    }

    // Step 2: Download the zipball
    const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`
    console.log(`Downloading ${url}...`)

    const response = await fetch(url, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to download repo zip: ${response.status} ${response.statusText}`)
    }

    // Create a temp directory for initial extraction
    const tempExtractPath = path.resolve(__dirname, '..', '..', 'temp_extract')
    const finalExtractPath = path.resolve(__dirname, '..', '..', 'website', 'i18n')

    // Ensure both directories exist
    await fs.mkdir(tempExtractPath, { recursive: true })
    await fs.mkdir(finalExtractPath, { recursive: true })

    try {
        // Step 3: Extract to temp directory first
        await new Promise((resolve, reject) => {
            if (!response.body) {
                return reject(new Error('Response body is null'))
            }

            // Convert ReadableStream to Node.js stream
            // @ts-ignore - Type compatibility issue between web streams and node streams
            const nodeStream = Readable.fromWeb(response.body)

            nodeStream
                .pipe(unzipper.Extract({ path: tempExtractPath }))
                .on('close', resolve)
                .on('error', reject)
        })

        // Step 4: Move contents from temp directory to final location
        const extractedDirs = await fs.readdir(tempExtractPath)
        const repoDir = extractedDirs[0] // This should be the GitHub repository directory (e.g., webdriverio-i18n-7b50bc6)
        const repoDirPath = path.join(tempExtractPath, repoDir)

        // Copy all contents from the repo directory to the final location
        const files = await fs.readdir(repoDirPath)
        for (const file of files) {
            const baseName = path.basename(file)
            if (baseName.startsWith('.') || IGNORE_FILES.includes(baseName)) {
                continue
            }

            const srcPath = path.join(repoDirPath, file)
            const destPath = path.join(finalExtractPath, file)

            // Handle the case if the file already exists in the destination
            try {
                await fs.rm(destPath, { recursive: true, force: true })
            } catch {
                // Ignore if file doesn't exist
            }

            await fs.cp(srcPath, destPath, { recursive: true })
        }

        console.log(`Repository extracted to ${finalExtractPath}`)
    } finally {
        // Clean up temp directory
        try {
            await fs.rm(tempExtractPath, { recursive: true, force: true })
        } catch (err) {
            console.warn('Failed to clean up temporary directory:', err)
        }
    }
}