import { describe, it, expect } from 'vitest'

import { formatBrokenPackages, IGNORE_PACKAGES, type BrokenPackages } from '../src/index.js'

describe('formatBrokenPackages', () => {
    it('lists each missing dependency and the files that use it', () => {
        const broken: BrokenPackages[] = [{
            package: 'wdio-cli',
            packagePath: '/packages/wdio-cli',
            dependencies: [],
            devDependencies: [],
            missing: {
                chalk: ['/packages/wdio-cli/src/index.ts', '/packages/wdio-cli/src/utils.ts']
            },
            using: {},
            invalidFiles: {},
            invalidDirs: {}
        }]

        const message = formatBrokenPackages(broken)
        expect(message).toContain('Broken Dependencies in wdio-cli')
        expect(message).toContain('* chalk missing')
        expect(message).toContain('/packages/wdio-cli/src/index.ts')
        expect(message).toContain('/packages/wdio-cli/src/utils.ts')
    })

    it('returns an empty string when nothing is broken', () => {
        expect(formatBrokenPackages([])).toBe('')
    })
})

describe('IGNORE_PACKAGES', () => {
    it('ignores known virtual modules in the browser runner', () => {
        expect(IGNORE_PACKAGES['wdio-browser-runner']).toContain('virtual:wdio')
        expect(IGNORE_PACKAGES['wdio-browser-runner']).toContain('@stencil/core')
    })
})
