import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import {
    applyDevtoolsLinkFix,
    applyElectronMockingLinkFix,
    applyFlowchartMermaidFix,
    getProtocolDiagram,
    rewriteExecuteAsyncLinks,
    IGNORE_FILES
} from '../src/downloadDocsTranslations.js'

const tempDirs: string[] = []

afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
        await fs.rm(dir, { recursive: true, force: true })
    }
})

describe('translation fixes', () => {
    it('rewrites stale Devtools.md links to the wdio/ prefix', () => {
        expect(applyDevtoolsLinkFix('See (devtools/console-logs) and (devtools/screencast#foo)'))
            .toBe('See (devtools/wdio/console-logs) and (devtools/wdio/screencast#foo)')
    })

    it('rewrites removed electron mocking links', () => {
        expect(applyElectronMockingLinkFix('See /docs/desktop-testing/electron/mocking'))
            .toBe('See /docs/desktop-testing/electron/api-reference')
    })

    it('replaces CreateFlowcharts tags with the English mermaid body', () => {
        const diagrams = new Map([['testexecution', '```mermaid\ngraph TD\n```']])
        const { fixed, unresolvedId } = applyFlowchartMermaidFix(
            'Intro\n<CreateFlowcharts id="testexecution" />\nOutro',
            diagrams
        )
        expect(unresolvedId).toBeUndefined()
        expect(fixed).toContain('```mermaid')
        expect(fixed).not.toContain('CreateFlowcharts')
    })

    it('reports an unresolved flowchart id', () => {
        const { unresolvedId } = applyFlowchartMermaidFix(
            '<CreateFlowcharts id="missing" />',
            new Map()
        )
        expect(unresolvedId).toBe('missing')
    })

    it('rewrites executeAsync links onto execute', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-i18n-'))
        tempDirs.push(dir)
        const file = path.join(dir, 'guide.md')
        await fs.writeFile(file, 'See api/browser/executeAsync and api/element/executeAsync#foo')
        await rewriteExecuteAsyncLinks(dir, 'de')
        expect(await fs.readFile(file, 'utf-8')).toBe('See api/browser/execute and api/element/execute#foo')
    })

    it('reads the Automation Protocols mermaid diagram', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-docs-'))
        tempDirs.push(dir)
        await fs.writeFile(path.join(dir, 'AutomationProtocols.md'), 'intro\n```mermaid\ngraph TD\n```\n')
        expect(await getProtocolDiagram(dir)).toBe('```mermaid\ngraph TD\n```')
    })

    it('ignores repo metadata files when extracting translations', () => {
        expect(IGNORE_FILES).toContain('package.json')
        expect(IGNORE_FILES).toContain('README.md')
    })
})
