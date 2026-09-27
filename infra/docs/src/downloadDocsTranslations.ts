import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'
import unzipper from 'unzipper'
import { Readable } from 'node:stream'

import { Octokit } from '@octokit/rest'
import { getRootDir } from '@wdio/repo-utils'

// GitHub repository information
export const REPO_OWNER = 'webdriverio'
export const REPO_NAME = 'i18n'

export const IGNORE_FILES = ['src', 'package.json', 'package-lock.json', 'README.md', 'LICENSE', 'tsconfig.json']

export const CREATE_FLOWCHARTS_TAG = /^[^\S\n]*<CreateFlowcharts\s+id=['"]([^'"]+)['"]\s*\/>[^\S\n]*$/gm
export const WEBDRIVER_IMAGE = /!\[[^\]]*]\(\/img\/webdriver\.png\)/g
export const EXECUTE_ASYNC_LINK = /api\/(browser|element)\/executeAsync/g

export interface TranslationsOptions {
    rootDir?: string
    auth?: string
}
/**
 * Reads the English flowchart docs and maps each page's `id` to its diagram body
 * (everything from the first heading or ```mermaid fence onwards, i.e. skipping the
 * frontmatter and intro paragraph).
 *
 * The English markdown is the single source of truth: the diagrams themselves were
 * never translated — they used to be rendered from a shared React component — so
 * splicing the English body into a translated page loses nothing.
 */
export async function getFlowchartDiagrams(flowchartsDir: string) {
    const diagrams = new Map<string, string>()
    const files = await fs.readdir(flowchartsDir).catch((err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
            return [] as string[]
        }
        throw err
    })

    for (const file of files.filter((f) => f.endsWith('.md'))) {
        const source = await fs.readFile(path.join(flowchartsDir, file), 'utf-8')
        const id = source.match(/^---\n(?:.*\n)*?id:\s*(\S+)\s*$/m)?.[1]
        const bodyStart = source.search(/^(##\s|```mermaid\s*$)/m)
        if (id && bodyStart !== -1) {
            diagrams.set(id, source.slice(bodyStart).trimEnd())
        }
    }

    return diagrams
}

export function applyDevtoolsLinkFix(content: string) {
    return content.replace(
        /\(devtools\/(interactive-test-rerunning|multi-framework-support|console-logs|network-logs|testlens|screencast)([^)]*)\)/g,
        '(devtools/wdio/$1$2)'
    )
}

export function applyElectronMockingLinkFix(content: string) {
    return content.replace(
        /\/docs\/desktop-testing\/electron\/mocking/g,
        '/docs/desktop-testing/electron/api-reference'
    )
}

export function applyFlowchartMermaidFix(
    content: string,
    diagrams: Map<string, string>
): { fixed: string, unresolvedId?: string } {
    let unresolvedId: string | undefined
    const fixed = content.replace(CREATE_FLOWCHARTS_TAG, (match, id: string) => {
        const diagram = diagrams.get(id)
        if (!diagram) {
            unresolvedId = id
            return match
        }
        return diagram
    })
    return { fixed, unresolvedId }
}

/**
 * Translated docs still point at the removed `executeAsync` pages. Rewrite those
 * links to `execute` until the i18n repo catches up.
 */
export async function rewriteExecuteAsyncLinks(contentPath: string, locale: string) {
    const files = await fs.readdir(contentPath, { recursive: true }).catch((err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
            return [] as string[]
        }
        throw err
    })
    for (const file of files) {
        if (typeof file !== 'string' || !file.endsWith('.md')) {
            continue
        }
        const filePath = path.join(contentPath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const fixed = content.replace(EXECUTE_ASYNC_LINK, 'api/$1/execute')
        if (fixed !== content) {
            await fs.writeFile(filePath, fixed)
            console.log(`Rewrote executeAsync links in ${locale}/${file}`)
        }
    }
}

/**
 * The English Automation Protocols page replaced the WebDriver setup image with
 * a mermaid diagram. Translations still point at the deleted file.
 */
export async function getProtocolDiagram(docsDir: string) {
    const source = await fs.readFile(path.join(docsDir, 'AutomationProtocols.md'), 'utf-8')
    const diagram = source.match(/```mermaid[\s\S]*?```/)?.[0]
    if (!diagram) {
        throw new Error('No mermaid diagram found in website/docs/AutomationProtocols.md. Translated pages still reference the deleted /img/webdriver.png.')
    }
    return diagram
}

/**
 * Patches known stale links in translated i18n files that become broken when English
 * source docs are restructured but translations haven't been updated yet.
 *
 * Add entries here whenever a doc restructure breaks translated pages.
 */
export async function applyTranslationFixes(i18nPath: string, docsDir: string) {
    const entries = await fs.readdir(i18nPath, { withFileTypes: true }).catch((err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
            return [] as Dirent[]
        }
        throw err
    })
    // only iterate locale directories; ignore stray files (e.g. .gitkeep, config)
    const locales = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

    const flowchartDiagrams = await getFlowchartDiagrams(path.join(docsDir, 'flowcharts'))
    const protocolDiagram = await getProtocolDiagram(docsDir)

    for (const locale of locales) {
        const contentPath = path.join(i18nPath, locale, 'docusaurus-plugin-content-docs', 'current')

        // Fix: translated flowchart pages still reference the <CreateFlowcharts /> component,
        // which was replaced by inline ```mermaid fences in the English docs. Without this
        // the MDX compiler fails every non-English locale with "Expected component
        // `CreateFlowcharts` to be defined". Remove once webdriverio/i18n is updated.
        const flowchartsPath = path.join(contentPath, 'flowcharts')
        const flowchartFiles = await fs.readdir(flowchartsPath).catch((err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                return [] as string[]
            }
            throw err
        })
        for (const file of flowchartFiles.filter((f) => f.endsWith('.md'))) {
            const filePath = path.join(flowchartsPath, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const { fixed, unresolvedId } = applyFlowchartMermaidFix(content, flowchartDiagrams)
            if (unresolvedId) {
                throw new Error(`No English flowchart diagram found for id '${unresolvedId}' referenced by ${locale}/flowcharts/${file}. Add the diagram to website/docs/flowcharts, or remove the <CreateFlowcharts /> reference from the translation.`)
            }
            if (fixed !== content) {
                await fs.writeFile(filePath, `${fixed.trimEnd()}\n`)
                console.log(`Applied flowchart mermaid fix to ${locale}/flowcharts/${file}`)
            }
        }

        // Fix: Devtools.md links missing wdio/ prefix after devtools section was restructured
        // Old: devtools/interactive-test-rerunning  New: devtools/wdio/interactive-test-rerunning
        const devtoolsPath = path.join(contentPath, 'Devtools.md')
        try {
            const content = await fs.readFile(devtoolsPath, 'utf-8')
            const fixed = applyDevtoolsLinkFix(content)
            if (fixed !== content) {
                await fs.writeFile(devtoolsPath, fixed)
                console.log(`Applied devtools link fix to ${locale}/Devtools.md`)
            }
        } catch (err) {
            // ignore missing translation file for this locale; rethrow real errors
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err
            }
        }

        // Fix: v10 removed executeAsync. Translated pages still link at the old API path.
        await rewriteExecuteAsyncLinks(contentPath, locale)

        // Fix: Electron.md links to /mocking page which no longer exists — point to
        // /api-reference instead (matches the English source's "how to mock" link)
        const electronPath = path.join(contentPath, 'desktop-testing', 'Electron.md')
        try {
            const content = await fs.readFile(electronPath, 'utf-8')
            const fixed = applyElectronMockingLinkFix(content)
            if (fixed !== content) {
                await fs.writeFile(electronPath, fixed)
                console.log(`Applied electron mocking link fix to ${locale}/desktop-testing/Electron.md`)
            }
        } catch (err) {
            // ignore missing translation file for this locale; rethrow real errors
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err
            }
        }

        // Fix: translated AutomationProtocols.md still embeds /img/webdriver.png,
        // which the English page replaced with a mermaid diagram. Without this the
        // docs build fails on every locale that still has the image.
        const protocolsPath = path.join(contentPath, 'AutomationProtocols.md')
        try {
            const content = await fs.readFile(protocolsPath, 'utf-8')
            const fixed = content.replace(WEBDRIVER_IMAGE, () => protocolDiagram)
            if (fixed !== content) {
                await fs.writeFile(protocolsPath, fixed)
                console.log(`Applied protocol diagram fix to ${locale}/AutomationProtocols.md`)
            }
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err
            }
        }
    }
}

export function downloadDocsTranslations(options: TranslationsOptions = {}) {
    const auth = options.auth ?? process.env.GITHUB_AUTH
    if (!auth) {
        throw new Error('GITHUB_AUTH is not set (hint: set GITHUB_AUTH envVar from `gh auth token` command)')
    }
    return downloadAndExtractRepo(REPO_OWNER, REPO_NAME, { ...options, auth })
}

async function downloadAndExtractRepo(
    owner: string,
    repo: string,
    options: TranslationsOptions & { auth: string },
    branch?: string
) {
    const rootDir = options.rootDir ?? getRootDir()
    const octokit = new Octokit({ auth: options.auth })

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
            Authorization: `token ${options.auth}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to download repo zip: ${response.status} ${response.statusText}`)
    }

    // Create a temp directory for initial extraction
    const tempExtractPath = path.resolve(rootDir, 'temp_extract')
    const finalExtractPath = path.resolve(rootDir, 'website', 'i18n')

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
        await applyTranslationFixes(
            finalExtractPath,
            path.resolve(rootDir, 'website', 'docs')
        )
    } finally {
        // Clean up temp directory
        try {
            await fs.rm(tempExtractPath, { recursive: true, force: true })
        } catch (err) {
            console.warn('Failed to clean up temporary directory:', err)
        }
    }
}
