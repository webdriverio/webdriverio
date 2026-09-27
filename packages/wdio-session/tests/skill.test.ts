import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { skill } from '../src/skill.js'

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'skill', 'SKILL.md')

describe('skill', () => {
    it('prints the bundled skill', async () => {
        const markdown = fs.readFileSync(SKILL, 'utf-8')
        const result = await skill({})
        expect(result.data).toEqual({ markdown })
        expect(`${result.text}\n`).toBe(markdown)
    })

    it('installs the skill into a project', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-skill-'))
        try {
            const result = await skill({ install: tmp })
            const dest = path.join(tmp, '.agents', 'skills', 'wdio-session', 'SKILL.md')
            expect(result.data).toEqual({ path: dest })
            expect(fs.readFileSync(dest, 'utf-8')).toBe(fs.readFileSync(SKILL, 'utf-8'))
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })
})
