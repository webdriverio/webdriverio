import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { generateEcosystemDocs } from '../src/ecosystemDocs.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('generateEcosystemDocs', () => {
    it('writes an ecosystem page from package metadata', () => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-eco-'))
        tempDirs.push(rootDir)
        const pkgDir = path.join(rootDir, 'packages', 'wdio-appium-service')
        fs.mkdirSync(pkgDir, { recursive: true })
        fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({
            name: '@wdio/appium-service',
            description: 'Starts Appium'
        }))

        generateEcosystemDocs(rootDir)

        const page = fs.readFileSync(path.join(rootDir, 'website', 'docs', '_ecosystem.md'), 'utf-8')
        expect(page).toContain('id: ecosystem')
        expect(page).toContain('@wdio/appium-service')
        expect(page).toContain('Starts Appium')
        expect(page).toContain('infra/docs/src/3rd-party')
    })
})
