import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { renderContributePage, copyContributingDocs } from '../src/copyContributingDocs.js'
import { renderResourcesPage } from '../src/downloadAwesomeResources.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('renderContributePage', () => {
    it('drops the first two lines of CONTRIBUTING.md and adds front matter', () => {
        const page = renderContributePage('# Contributing\n\nYou like WebdriverIO')
        expect(page).toContain('id: contribute')
        expect(page).toContain('You like WebdriverIO')
        expect(page).not.toContain('# Contributing')
    })
})

describe('copyContributingDocs', () => {
    it('writes website/docs/Contribute.md from CONTRIBUTING.md', async () => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-contrib-'))
        tempDirs.push(rootDir)
        fs.mkdirSync(path.join(rootDir, 'website', 'docs'), { recursive: true })
        fs.writeFileSync(path.join(rootDir, 'CONTRIBUTING.md'), '# Contributing\n\nHello contributors\n')

        await copyContributingDocs({ rootDir })

        const written = fs.readFileSync(path.join(rootDir, 'website', 'docs', 'Contribute.md'), 'utf-8')
        expect(written).toContain('id: contribute')
        expect(written).toContain('Hello contributors')
    })
})

describe('renderResourcesPage', () => {
    it('keeps content from the WebdriverIO Ecosystem heading onward', () => {
        const page = renderResourcesPage('# Awesome\n\nintro\n## WebdriverIO Ecosystem\n- foo')
        expect(page).toContain('id: resources')
        expect(page).toContain('## WebdriverIO Ecosystem')
        expect(page).toContain('- foo')
        expect(page).not.toContain('# Awesome')
    })
})
