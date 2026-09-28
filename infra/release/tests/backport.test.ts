import { describe, it, expect } from 'vitest'

import {
    filterPrsToBackport,
    getPrompt,
    requireGithubAuth,
    requireMaintenanceBranch,
    maintenanceLTSVersion
} from '../src/backport.js'

describe('filterPrsToBackport', () => {
    it('keeps merged PRs labeled backport-requested, oldest first', () => {
        const prs = [
            { labels: [{ name: 'backport-requested' }], merged_at: '2026-09-02', title: 'newer' },
            { labels: [{ name: 'backport-requested' }], merged_at: null, title: 'unmerged' },
            { labels: [{ name: 'bug' }], merged_at: '2026-09-01', title: 'no-label' },
            { labels: [{ name: 'backport-requested' }], merged_at: '2026-09-01', title: 'older' }
        ]
        expect(filterPrsToBackport(prs).map((pr) => pr.title)).toEqual(['older', 'newer'])
    })
})

describe('getPrompt', () => {
    it('asks whether to backport a PR and optionally exit', () => {
        const prompts = getPrompt({
            title: 'Fix click',
            user: { login: 'someone' },
            html_url: 'https://github.com/webdriverio/webdriverio/pull/1'
        })
        expect(prompts[0].message).toContain('Fix click')
        expect(prompts[0].message).toContain('someone')
        expect(prompts[1].when?.({ toBackport: false })).toBe(true)
        expect(prompts[1].when?.({ toBackport: true })).toBe(false)
    })
})

describe('requireGithubAuth', () => {
    it('throws when GITHUB_AUTH is missing', () => {
        expect(() => requireGithubAuth(undefined)).toThrow(/GITHUB_AUTH/)
    })

    it('returns the token when present', () => {
        expect(requireGithubAuth('token')).toBe('token')
    })
})

describe('requireMaintenanceBranch', () => {
    it('requires the configured maintenance LTS branch', () => {
        expect(() => requireMaintenanceBranch('main')).toThrow(/git checkout/)
        expect(() => requireMaintenanceBranch(`${maintenanceLTSVersion}\n`)).not.toThrow()
    })
})
