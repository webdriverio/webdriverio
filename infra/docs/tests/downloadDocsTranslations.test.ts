import { describe, it, expect } from 'vitest'

import {
    applyDevtoolsLinkFix,
    applyElectronMockingLinkFix,
    applyFlowchartMermaidFix,
    IGNORE_FILES
} from '../src/downloadDocsTranslations.js'

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

    it('ignores repo metadata files when extracting translations', () => {
        expect(IGNORE_FILES).toContain('package.json')
        expect(IGNORE_FILES).toContain('README.md')
    })
})
