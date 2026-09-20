import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { getRootDir, getSubPackages, buildPreface } from '../src/helpers.js'
import { organizationName, projectName, branch, repoUrl } from '../src/constants.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('getRootDir', () => {
    it('resolves the monorepo root from infra/utils', () => {
        const root = getRootDir()
        expect(fs.existsSync(path.join(root, 'lerna.json'))).toBe(true)
        expect(fs.existsSync(path.join(root, 'packages'))).toBe(true)
        expect(fs.existsSync(path.join(root, 'infra', 'utils'))).toBe(true)
    })
})

describe('getSubPackages', () => {
    it('lists package directories and skips ignored names and files', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-packages-'))
        tempDirs.push(dir)
        fs.mkdirSync(path.join(dir, 'wdio-logger'))
        fs.mkdirSync(path.join(dir, 'webdriverio'))
        fs.mkdirSync(path.join(dir, 'node_modules'))
        fs.mkdirSync(path.join(dir, 'wdio-smoke-test-service'))
        fs.writeFileSync(path.join(dir, 'README.md'), 'not a package')

        expect(getSubPackages(['wdio-smoke-test-service'], dir).sort()).toEqual([
            'wdio-logger',
            'webdriverio'
        ])
    })

    it('returns real monorepo packages when called without overrides', () => {
        const packages = getSubPackages()
        expect(packages).toContain('webdriverio')
        expect(packages).toContain('wdio-logger')
        expect(packages).not.toContain('node_modules')
    })
})

describe('buildPreface', () => {
    it('renders docusaurus front matter and tab imports', () => {
        expect(buildPreface('allure-reporter', 'Allure', 'Reporter', 'https://example.com/edit')).toEqual([
            '---',
            'id: allure-reporter',
            'title: Allure Reporter',
            'custom_edit_url: https://example.com/edit',
            '---\n',
            'import Tabs from \'@theme/Tabs\';',
            'import TabItem from \'@theme/TabItem\';\n'
        ])
    })
})

describe('constants', () => {
    it('describes the public GitHub repository', () => {
        expect(organizationName).toBe('webdriverio')
        expect(projectName).toBe('webdriverio')
        expect(branch).toBe('main')
        expect(repoUrl).toBe('https://github.com/webdriverio/webdriverio')
    })
})
