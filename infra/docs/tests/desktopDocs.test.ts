import { describe, it, expect } from 'vitest'

import { applyDesktopTransforms, buildDesktopFrontMatter } from '../src/desktopDocs.js'
import { ELECTRON_DOCS_CONFIG } from '../src/electronDocs.js'
import { TAURI_DOCS_CONFIG } from '../src/tauriDocs.js'
import { DIOXUS_DOCS_CONFIG } from '../src/dioxusDocs.js'

const helpers = {
    resolveRelativePath: (relativePath: string) => `https://raw.example/${relativePath}`,
    resolveRepoBlobUrl: (relativePath: string) => `https://github.example/${relativePath}`
}

describe('buildDesktopFrontMatter', () => {
    it('points the edit URL at the source file in desktop-mobile', () => {
        expect(buildDesktopFrontMatter(
            'configuration',
            'Configuration',
            'webdriverio/desktop-mobile',
            'packages/electron-service/docs/configuration.md'
        )).toContain('custom_edit_url: https://github.com/webdriverio/desktop-mobile/edit/main/packages/electron-service/docs/configuration.md')
    })
})

describe('applyDesktopTransforms', () => {
    it('rewrites in-doc links and relative images for Electron', () => {
        const raw = '# Title\n\nSee [api](./api-reference.md)\n\n![shot](../../assets/shot.png)\n<img src="../../assets/logo.png">'
        const result = applyDesktopTransforms(raw, ELECTRON_DOCS_CONFIG, helpers)
        expect(result).not.toContain('# Title')
        expect(result).toContain('/docs/desktop-testing/electron/api-reference')
        expect(result).toContain('https://raw.example/../../assets/shot.png')
        expect(result).toContain('https://raw.example/../../assets/logo.png')
    })

    it('escapes component-like tags in Tauri prose but not in code fences', () => {
        const raw = '# Title\n\nUse <Result> here\n\n```ts\nconst x: Result<T> = 1\n```\n'
        const result = applyDesktopTransforms(raw, TAURI_DOCS_CONFIG, helpers)
        expect(result).toContain('\\<Result>')
        expect(result).toContain('const x: Result<T> = 1')
    })

    it('rewrites leftover relative links and escapes generics for Dioxus', () => {
        const raw = '# Title\n\nSee [types](../../native-types/src/foo.ts) and Record<string, string>'
        const result = applyDesktopTransforms(raw, DIOXUS_DOCS_CONFIG, helpers)
        expect(result).toContain('https://github.example/../../native-types/src/foo.ts')
        expect(result).toContain('Record\\<string, string>')
    })
})
