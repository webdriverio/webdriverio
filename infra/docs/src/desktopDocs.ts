import fs from 'node:fs/promises'
import path from 'node:path'
import { downloadFromGitHub, getRootDir } from '@wdio/repo-utils'
import { buildLinkRewriter, type PageProps } from './docsUtils.js'

export interface DesktopDocsConfig {
    allDocs: Record<string, PageProps>
    githubRepo: string
    docsSha: string
    docsSourceDir: string
    websiteDocsPath: string[]
    publishedUrlPrefix: string
    /**
     * Extra per-line transform applied after shared image/link rewriting.
     * Used by Tauri (escape `<Result>`) and Dioxus (generics + leftover relative links).
     */
    transformLine?: (line: string, inCodeBlock: boolean) => string
    /**
     * Extra whole-document transform applied after line-by-line processing.
     */
    transformContent?: (content: string, helpers: DesktopTransformHelpers) => string
}

export interface DesktopTransformHelpers {
    resolveRelativePath: (relativePath: string) => string
    resolveRepoBlobUrl: (relativePath: string) => string
}

export function applyDesktopTransforms(
    raw: string,
    config: DesktopDocsConfig,
    helpers: DesktopTransformHelpers
) {
    const rewriteLinks = buildLinkRewriter(config.allDocs, config.publishedUrlPrefix)
    // Drop the source's first H1 heading (Docusaurus uses front-matter title)
    const stripped = raw.replace(/^#[^\n]*\n+/, '')

    let inCodeBlock = false
    let transformed = rewriteLinks(stripped)
        // Rewrite repo-relative image paths in markdown syntax to absolute raw GitHub URLs
        .replace(
            /!\[([^\]]*)\]\(((?:\.\.\/)+[^\s)"']+)((?:\s+'[^']*')?)\)/g,
            (_match, alt: string, relativePath: string, title: string) =>
                `![${alt}](${helpers.resolveRelativePath(relativePath)}${title})`
        )
        // Rewrite repo-relative image paths in HTML src attributes to absolute raw GitHub URLs
        .replace(
            /(src=")((?:\.\.\/)+[^\s"]+)/g,
            (_match, prefix: string, relativePath: string) =>
                `${prefix}${helpers.resolveRelativePath(relativePath)}`
        )

    if (config.transformContent) {
        transformed = config.transformContent(transformed, helpers)
    }

    if (config.transformLine) {
        transformed = transformed.split('\n').map((line) => {
            if (/^```/.test(line)) { inCodeBlock = !inCodeBlock }
            return config.transformLine!(line, inCodeBlock)
        }).join('\n')
    }

    return transformed
}

export function buildDesktopFrontMatter(id: string, title: string, githubRepo: string, remotePath: string) {
    return `---
id: ${id}
title: ${title}
custom_edit_url: https://github.com/${githubRepo}/edit/main/${remotePath}
---`
}

export async function generateDesktopServiceDocs (config: DesktopDocsConfig, rootDir = getRootDir()) {
    const docsPath = path.join(rootDir, ...config.websiteDocsPath)
    await fs.mkdir(docsPath, { recursive: true })

    for (const [id, { sourcePath, title }] of Object.entries(config.allDocs)) {
        const newDocsPath = path.join(docsPath, `${id}.md`)
        const remotePath = `${config.docsSourceDir}/${sourcePath}`
        const raw = await downloadFromGitHub(
            `https://raw.githubusercontent.com/${config.githubRepo}`,
            config.docsSha,
            remotePath
        )

        const sourceFileDir = path.posix.dirname(remotePath)
        const helpers: DesktopTransformHelpers = {
            resolveRelativePath: (relativePath: string) => {
                const resolved = path.posix.normalize(`${sourceFileDir}/${relativePath}`)
                return `https://raw.githubusercontent.com/${config.githubRepo}/${config.docsSha}/${resolved}`
            },
            resolveRepoBlobUrl: (relativePath: string) => {
                const resolved = path.posix.normalize(`${sourceFileDir}/${relativePath}`)
                return `https://github.com/${config.githubRepo}/blob/${config.docsSha}/${resolved}`
            }
        }

        const transformed = applyDesktopTransforms(raw, config, helpers)

        await fs.writeFile(newDocsPath, `${buildDesktopFrontMatter(id, title, config.githubRepo, remotePath)}
${transformed}`)
        console.log(`Generated docs for ${newDocsPath}`)
    }
}
