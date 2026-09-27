import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { vi, describe, expect, it } from 'vitest'

import { readSessionSkill, writeAgentSupport } from '../../src/cli/agent.js'
import { runConfigCommand } from '../../src/cli/utils.js'

vi.mock('../../src/utils.js', async () => {
    const actual = await vi.importActual('../../src/utils.js') as Record<string, unknown>
    return {
        ...actual,
        createPackageJSON: vi.fn(),
        setupTypeScript: vi.fn(),
        npmInstall: vi.fn(),
        createWDIOConfig: vi.fn(),
        createWDIOScript: vi.fn(),
        runAppiumInstaller: vi.fn()
    }
})

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'wdio-session', 'SKILL.md')
const CANONICAL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'wdio-session', 'src', 'skill', 'SKILL.md')

describe('agent support', () => {
    it('ships the same skill as @wdio/session', () => {
        expect(fs.readFileSync(SKILL, 'utf-8')).toBe(fs.readFileSync(CANONICAL, 'utf-8'))
        expect(readSessionSkill()).toBe(fs.readFileSync(CANONICAL, 'utf-8'))
    })

    it('writes the skill, AGENTS.md and gitignore', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'create-wdio-agent-'))
        try {
            fs.writeFileSync(path.join(tmp, 'AGENTS.md'), '# Project\n')
            fs.writeFileSync(path.join(tmp, '.gitignore'), 'node_modules\n')
            writeAgentSupport(tmp)
            expect(fs.readFileSync(path.join(tmp, '.agents', 'skills', 'wdio-session', 'SKILL.md'), 'utf-8')).toBe(fs.readFileSync(CANONICAL, 'utf-8'))
            const agents = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
            expect(agents).toContain('## End-to-end tests (WebdriverIO v10)')
            expect(agents).toContain('.agents/skills/wdio-session/SKILL.md')
            expect(fs.readFileSync(path.join(tmp, '.gitignore'), 'utf-8')).toContain('.wdio/session/')
            const skillPath = path.join(tmp, '.agents', 'skills', 'wdio-session', 'SKILL.md')
            fs.writeFileSync(skillPath, 'local skill\n')
            writeAgentSupport(tmp)
            expect(fs.readFileSync(skillPath, 'utf-8')).toBe('local skill\n')
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('writes nothing when agent support is declined', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'create-wdio-agent-no-'))
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        try {
            await runConfigCommand({ projectRootDir: tmp, rawAnswers: { agentSupport: false } } as any, 'next')
            expect(fs.existsSync(path.join(tmp, '.agents'))).toBe(false)
            expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
            expect(fs.existsSync(path.join(tmp, '.gitignore'))).toBe(false)
        } finally {
            log.mockRestore()
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('writes the files when agent support is accepted', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'create-wdio-agent-yes-'))
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        try {
            await runConfigCommand({ projectRootDir: tmp, rawAnswers: { agentSupport: true } } as any, 'next')
            expect(fs.existsSync(path.join(tmp, '.agents', 'skills', 'wdio-session', 'SKILL.md'))).toBe(true)
            expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(true)
            expect(fs.readFileSync(path.join(tmp, '.gitignore'), 'utf-8')).toContain('.wdio/session/')
        } finally {
            log.mockRestore()
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })
})
