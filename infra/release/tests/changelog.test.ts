import { describe, it, expect } from 'vitest'

import { formatChangelogEntry, insertChangelog } from '../src/changelog.js'
import { getPushTagCommand } from '../src/pushTags.js'

describe('formatChangelogEntry', () => {
    it('returns undefined when there are no changes after the version date', () => {
        expect(formatChangelogEntry('## Unreleased\n\n', '9.32.0')).toBeUndefined()
    })

    it('keeps the portion starting at the date and prefixes the package version', () => {
        const markdown = '## Unreleased (2026-09-20)\n\n* fix: something (#1)\n'
        expect(formatChangelogEntry(markdown, '9.32.0')).toBe(
            '## v9.32.0 (2026-09-20)\n\n* fix: something (#1)\n\n'
        )
    })
})

describe('insertChangelog', () => {
    it('inserts the new entry after the leading --- of CHANGELOG.md', () => {
        const existing = '# Changelog\n\n---\n\n## v9.31.0\n'
        expect(insertChangelog(existing, '## v9.32.0 (today)\n')).toBe(
            '# Changelog\n\n---\n\n## v9.32.0 (today)\n\n\n## v9.31.0\n'
        )
    })
})

describe('getPushTagCommand', () => {
    it('force-pushes the annotated release tag without running hooks', () => {
        expect(getPushTagCommand('9.32.0')).toBe(
            'git push origin refs/tags/v9.32.0 -f --no-verify'
        )
    })
})
