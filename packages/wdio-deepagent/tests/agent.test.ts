import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness, interruptsForHeal, isSmallModelForMcp, permissionsForHeal } from '../src/agent.js'
import type { HealMode } from '../src/config/index.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('permissionsForHeal / interruptsForHeal', () => {
    it('propose is read-only: reads allowed everywhere, all writes denied', () => {
        expect(permissionsForHeal('propose')).toEqual([
            { operations: ['read'], paths: ['/**'], mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ])
    })

    it('ask and auto deny sensitive paths first, then allow the rest', () => {
        const scoped = [
            { operations: ['read', 'write'], paths: ['/wdio.conf*', '/**/wdio.conf*'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/.env*', '/**/.env*'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/.git/**', '/**/.git/**'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/node_modules/**', '/**/node_modules/**'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/.npmrc', '/**/.npmrc'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/*.pem', '/**/*.pem'], mode: 'deny' },
            { operations: ['read', 'write'], paths: ['/*.key', '/**/*.key'], mode: 'deny' },
            {
                operations: ['write'],
                paths: [
                    '/.github/**', '/**/.github/**',
                    '/package.json', '/**/package.json',
                    '/package-lock.json', '/**/package-lock.json',
                    '/pnpm-lock.yaml', '/**/pnpm-lock.yaml',
                    '/yarn.lock', '/**/yarn.lock',
                    '/.husky/**', '/**/.husky/**',
                ],
                mode: 'deny',
            },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'allow' },
        ]
        expect(permissionsForHeal('ask')).toEqual(scoped)
        expect(permissionsForHeal('auto')).toEqual(scoped)
    })

    it('ask gates write tools with interrupts; auto/propose do not', () => {
        expect(interruptsForHeal('ask')).toEqual({ write_file: true, edit_file: true, delete_file: true })
        expect(interruptsForHeal('auto')).toEqual({})
        expect(interruptsForHeal('propose')).toEqual({})
    })
})

describe('isSmallModelForMcp', () => {
    it('flags models with ≤7B parameter counts', () => {
        expect(isSmallModelForMcp('qwen/qwen3.5-4b')).toBe(true)
        expect(isSmallModelForMcp('llama-3.2-1b')).toBe(true)
        expect(isSmallModelForMcp('mixtral-8x7b')).toBe(true)
        expect(isSmallModelForMcp('qwen2.5-coder-0.5b')).toBe(true)
    })

    it('does not flag larger models or ids without param counts', () => {
        expect(isSmallModelForMcp('qwen2.5-coder-32b')).toBe(false)
        expect(isSmallModelForMcp('moonshotai/kimi-k3')).toBe(false)
        expect(isSmallModelForMcp('gpt-5.5')).toBe(false)
        expect(isSmallModelForMcp('claude-3-5-sonnet')).toBe(false)
    })
})

describe('createDeepAgentHarness (smoke, no network)', () => {
    it('builds an agent with traversal + trace + kb tools and executes a tool call', async () => {
        const markerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-marker-'))
        const marker = path.join(markerDir, 'called.json')
        process.env.FIXTURE_MARKER = marker
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'fixture_navigate', args: { url: 'https://example.com' }, id: 'call-1' }]],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            projectRoot: process.cwd(),
            heal: 'ask',
        })

        try {
            // tool surface assembled from all three groups
            const names = harness.tools.map((t) => t.name)
            expect(names).toContain('fixture_navigate')
            expect(names).toContain('ingest_trace')
            expect(names).toContain('remember_snapshot')

            const run = await harness.agent.invoke({
                messages: [new HumanMessage('Navigate to the homepage')],
            })
            // the agent loop ran to completion
            expect(run).toBeDefined()

            // the traversal tool actually executed over the wire
            const markerContent = await fs.readFile(marker, 'utf8').catch(() => null)
            expect(markerContent).not.toBeNull()
            expect(JSON.parse(markerContent!)).toMatchObject({ url: 'https://example.com' })
        } finally {
            await harness.close()
            delete process.env.FIXTURE_MARKER
            await fs.rm(markerDir, { recursive: true, force: true })
        }
    })

    it('points the system prompt at the wdio config inside projectRoot', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-confighint-'))
        const configPath = path.join(projRoot, 'wdio.conf.ts')
        await fs.writeFile(configPath, '')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
            mcp: null,
            projectRoot: projRoot,
            configPath,
        })
        try {
            const run = await harness.agent.invoke({ messages: [new HumanMessage('hi')] })
            const texts = run.messages.map((m) => String((m as { content?: unknown }).content ?? '')).join('\n')
            expect(texts).toContain('wdio.conf')
        } finally {
            await harness.close()
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('recovers any MCP tool error into tool content instead of failing the turn', async () => {
        process.env.FIXTURE_SESSION_LOST = '1'
        try {
            const content = await runSingleTool(
                'ask',
                process.cwd(),
                'fixture_navigate',
                { url: 'https://example.com' },
            )
            // the adapter threw on the isError result; the error-recovery
            // wrapper turned it into content the model can react to
            expect(content).toMatch(/^Error:/)
            expect(content).toMatch(/no active browser session/i)
        } finally {
            delete process.env.FIXTURE_SESSION_LOST
        }
    })

    it('refuses a request-override model when tools are present', async () => {
        await expect(createDeepAgentHarness({
            model: {
                provider: 'openai', model: 'fake', request: async () => 'text-only',
                temperature: 0,
                maxTokens: 128
            },
            mcp: { command: process.execPath, args: [MCP_SERVER] },
        })).rejects.toThrow(/does not support tool calling|text-only/)
    })
})

/** Runs a single fs tool call through a real harness; returns the ToolMessage text. */
async function runSingleTool(
    heal: HealMode,
    projectRoot: string,
    tool: string,
    args: Record<string, unknown>,
): Promise<string> {
    const harness = await createDeepAgentHarness({
        model: { provider: 'openai', model: 'fake' },
        modelOverride: new FakeToolCallingModel({
            toolCalls: [[{ name: tool, args, id: 'call-1' }]],
            toolStyle: 'openai',
        }),
        mcp: { command: process.execPath, args: [MCP_SERVER] },
        traceDir: 'test-results',
        projectRoot,
        heal,
    })
    try {
        const run = await harness.agent.invoke({ messages: [new HumanMessage('go')] })
        const toolMsg = run.messages.find(
            (m) => (m as { tool_call_id?: string }).tool_call_id === 'call-1',
        )
        const content = (toolMsg as { content?: unknown } | undefined)?.content
        return typeof content === 'string' ? content : JSON.stringify(content)
    } finally {
        await harness.close()
    }
}

describe('filesystem scope enforcement (real backend)', () => {
    it('confines host-style paths to projectRoot and applies the deny rules', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-scope-'))
        const insideFile = path.join(projRoot, 'app.txt')
        const envFile = path.join(projRoot, '.env')
        const evilFile = path.join(projRoot, 'tmp', 'evil.txt')
        await fs.writeFile(insideFile, 'project data')
        await fs.writeFile(envFile, 'SECRET=1')
        try {
            // host-escape reads resolve INSIDE the virtual root: `/etc/passwd`
            // is simply a file that does not exist under projectRoot (ENOENT)
            const outsideRead = await runSingleTool('auto', projRoot, 'read_file', { path: '/etc/passwd' })
            expect(outsideRead).toMatch(/not found|ENOENT/)

            // sensitive-path deny rules win over the allow rule (first match)
            const envRead = await runSingleTool('auto', projRoot, 'read_file', { path: '/.env' })
            expect(envRead).toMatch(/permission denied/)

            // a host-escape write is confined too: it lands under the virtual root
            const outsideWrite = await runSingleTool('auto', projRoot, 'write_file', {
                path: '/tmp/evil.txt',
                content: 'x',
            })
            expect(outsideWrite).toContain('Successfully wrote')
            expect(await fs.readFile(evilFile, 'utf8')).toBe('x')
            await expect(fs.access('/tmp/evil.txt')).rejects.toThrow()

            const insideRead = await runSingleTool('auto', projRoot, 'read_file', { path: '/app.txt' })
            expect(insideRead).toContain('project data')

            const insideWrite = path.join(projRoot, 'written.txt')
            const writeResult = await runSingleTool('auto', projRoot, 'write_file', {
                path: '/written.txt',
                content: 'ok',
            })
            expect(writeResult).toContain('Successfully wrote')
            expect(await fs.readFile(insideWrite, 'utf8')).toBe('ok')
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
            await fs.rm('/tmp/evil.txt', { force: true })
        }
    })

    it('propose mode denies writes inside the project root too', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-propose-'))
        try {
            const result = await runSingleTool('propose', projRoot, 'write_file', {
                path: '/x.txt',
                content: 'x',
            })
            expect(result).toMatch(/permission denied/)
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('denies nested sensitive files for read and write in auto mode', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-nested-'))
        // root-anchored deny rules miss these: `*` does not cross `/`
        const nested = {
            'pkg/.env': 'SECRET=1',
            'pkg/.npmrc': 'registry=https://evil.example',
            'pkg/cert.pem': 'PEM-DATA',
            'pkg/id_rsa.key': 'KEY-DATA',
            'pkg/node_modules/dep/index.js': '// dep',
        }
        try {
            for (const [rel, content] of Object.entries(nested)) {
                const abs = path.join(projRoot, rel)
                await fs.mkdir(path.dirname(abs), { recursive: true })
                await fs.writeFile(abs, content)
                const vPath = `/${rel}`
                const read = await runSingleTool('auto', projRoot, 'read_file', { path: vPath })
                expect(read).toMatch(/permission denied/, `read ${rel}`)
                const write = await runSingleTool('auto', projRoot, 'write_file', { path: vPath, content: 'x' })
                expect(write).toMatch(/permission denied/, `write ${rel}`)
                // the deny actually blocked the write
                expect(await fs.readFile(abs, 'utf8')).toBe(content)
            }
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('write-denies infra files but keeps them readable in auto mode', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-infra-'))
        const infra = {
            '.github/workflows/ci.yml': 'on: push',
            'package.json': '{"name": "x"}',
            'package-lock.json': '{"lockfileVersion": 3}',
            'pnpm-lock.yaml': 'lockfileVersion: \'9.0\'',
            'yarn.lock': '# yarn lockfile',
            '.husky/pre-commit': '#!/bin/sh',
        }
        try {
            for (const [rel, content] of Object.entries(infra)) {
                const abs = path.join(projRoot, rel)
                await fs.mkdir(path.dirname(abs), { recursive: true })
                await fs.writeFile(abs, content)
                const vPath = `/${rel}`
                const read = await runSingleTool('auto', projRoot, 'read_file', { path: vPath })
                expect(JSON.parse(read)[0].text).toContain(content, `read ${rel}`)
                const write = await runSingleTool('auto', projRoot, 'write_file', { path: vPath, content: 'x' })
                expect(write).toMatch(/permission denied/, `write ${rel}`)
                expect(await fs.readFile(abs, 'utf8')).toBe(content)
            }
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })
})

describe('filesystem is rooted at projectRoot (virtual mode)', () => {
    it("ls('/') lists the project root", async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cwd-'))
        try {
            await fs.writeFile(path.join(projRoot, 'marker.spec.js'), '// marker')
            const content = await runSingleTool('auto', projRoot, 'ls', { path: '/' })
            expect(content).toContain('/marker.spec.js')
            expect(content).not.toContain(projRoot)
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('write_file("/foo.spec.js") lands in projectRoot', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cwd-'))
        try {
            const result = await runSingleTool('auto', projRoot, 'write_file', {
                path: '/foo.spec.js',
                content: 'it("works", () => {})',
            })
            expect(result).toContain('Successfully wrote')
            expect(await fs.readFile(path.join(projRoot, 'foo.spec.js'), 'utf8')).toContain('works')
            await expect(fs.access(path.join(process.cwd(), 'foo.spec.js'))).rejects.toThrow()
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('glob from "/" returns project-relative paths', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cwd-'))
        try {
            await fs.mkdir(path.join(projRoot, 'specs'), { recursive: true })
            await fs.writeFile(path.join(projRoot, 'specs', 'navigation.spec.js'), '// nav')
            const content = await runSingleTool('auto', projRoot, 'glob', {
                pattern: '**/*.spec.js',
                path: '/',
            })
            expect(content).toContain('/specs/navigation.spec.js')
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })

    it('read_file("/etc/passwd") cannot escape to host', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cwd-'))
        try {
            const content = await runSingleTool('auto', projRoot, 'read_file', { path: '/etc/passwd' })
            expect(content).toMatch(/not found|ENOENT/)
            expect(content).not.toContain('/root:/')
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })
})

describe('ask-mode human-in-the-loop gating (checkpointer-backed)', () => {
    it('pauses before a gated write and applies it only after approval', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-ask-'))
        const spec = path.join(projRoot, 'spec.js')
        await fs.writeFile(spec, 'const a = 1\n')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{
                    name: 'edit_file',
                    args: { file_path: '/spec.js', old_string: 'const a = 1', new_string: 'const a = 2' },
                    id: 'call-edit-1',
                }], []],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            projectRoot: projRoot,
            heal: 'ask',
        })
        try {
            // 1. the gated edit_file pauses for approval — no write yet
            const run = await harness.agent.invoke({ messages: [new HumanMessage('fix the spec')] })
            const interrupts = (run as { __interrupt__?: unknown[] }).__interrupt__ ?? []
            expect(interrupts.length).toBeGreaterThan(0)
            expect(await fs.readFile(spec, 'utf8')).toBe('const a = 1\n')

            // 2. approving the requested action applies the edit
            const request = (interrupts[0] as { value: { actionRequests: unknown[] } }).value
            await harness.agent.invoke(
                new Command({ resume: { decisions: request.actionRequests.map(() => ({ type: 'approve' })) } }),
            )
            expect(await fs.readFile(spec, 'utf8')).toBe('const a = 2\n')
        } finally {
            await harness.close()
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })
})

describe('mcp: null — harness without browser tools', () => {
    it('skips the browser surface but the fs tools still execute through the agent', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-mcpnull-'))
        const target = path.join(projRoot, 'written.txt')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'write_file', args: { path: '/written.txt', content: 'null mcp ok' }, id: 'call-1' }]],
                toolStyle: 'openai',
            }),
            mcp: null,
            traceDir: 'test-results',
            projectRoot: projRoot,
            heal: 'auto',
        })

        try {
            // no browser surface: no MCP client, no traversal tools
            expect(harness.mcpClient).toBeNull()
            const names = harness.tools.map((t) => t.name)
            expect(names).not.toContain('fixture_navigate')
            expect(names).toContain('ingest_trace')

            // the filesystem surface works without MCP: the write lands on disk
            const run = await harness.agent.invoke({ messages: [new HumanMessage('go')] })
            expect(run).toBeDefined()
            expect(await fs.readFile(target, 'utf8')).toBe('null mcp ok')
        } finally {
            await harness.close()
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })
})
