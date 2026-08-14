import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness, fromVirtualPath, interruptsForHeal, isSmallModelForMcp, normalizePermissionRoot, permissionsForHeal, toVirtualPath } from '../src/agent.js'
import type { HealMode } from '../src/config/index.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('permissionsForHeal / interruptsForHeal', () => {
    // `/proj` is a POSIX absolute path; on Windows `path.resolve` anchors it to
    // the current drive (`D:\proj`), which `permissionsForHeal` normalizes to
    // the deepagents virtual form. Compute the expected root the same way so
    // the assertions hold on both platforms.
    const proj = normalizePermissionRoot(path.resolve('/proj'))
    const underProj = [proj, `${proj}/**`]

    it('propose is read-only: reads allowed under the root, all writes denied', () => {
        expect(permissionsForHeal('propose', '/proj')).toEqual([
            { operations: ['read'], paths: underProj, mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ])
    })

    it('ask and auto confine read+write to the project root, denying sensitive paths first', () => {
        const scoped = [
            { operations: ['read', 'write'], paths: [`${proj}/wdio.conf*`], mode: 'deny' },
            { operations: ['read', 'write'], paths: [`${proj}/.env*`], mode: 'deny' },
            { operations: ['read', 'write'], paths: [`${proj}/.git/**`], mode: 'deny' },
            { operations: ['read', 'write'], paths: [`${proj}/node_modules/**`], mode: 'deny' },
            { operations: ['read', 'write'], paths: underProj, mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ]
        expect(permissionsForHeal('ask', '/proj')).toEqual(scoped)
        expect(permissionsForHeal('auto', '/proj')).toEqual(scoped)
    })

    it('normalizes trailing slashes, relative roots and the full-scope root', () => {
        expect(permissionsForHeal('auto', '/proj/')[4].paths).toEqual(underProj)
        const relRoot = normalizePermissionRoot(path.resolve('some/dir'))
        expect(permissionsForHeal('auto', 'some/dir')[4].paths).toEqual([relRoot, `${relRoot}/**`])
        expect(permissionsForHeal('auto', 'some/dir')[5].paths[0]).toBe('/**')
        // projectRoot '/' = explicit full scope: allow matches everything first.
        // On win32 `path.resolve('/')` is `D:\` so the impl yields `/D:`-prefixed
        // globs — compute the expectation the same way the impl does.
        const fullScope = normalizePermissionRoot(path.resolve('/'))
        const fullPrefix = fullScope === '/' ? '' : fullScope
        expect(permissionsForHeal('auto', '/')[0].paths).toEqual([`${fullPrefix}/wdio.conf*`])
        expect(permissionsForHeal('auto', '/')[4].paths).toEqual(
            fullScope === '/' ? ['/', '/**'] : [fullScope, `${fullScope}/**`],
        )
    })

    it('normalizePermissionRoot yields `/`-prefixed forward-slash globs (deepagents contract)', () => {
        expect(normalizePermissionRoot('C:\\users\\bob\\proj\\')).toBe('/C:/users/bob/proj')
        expect(normalizePermissionRoot('/home/bob/proj/')).toBe('/home/bob/proj')
        expect(normalizePermissionRoot('/')).toBe('/')
        // deepagents validatePath rejects globs that do not start with `/`
        for (const rule of permissionsForHeal('ask', '/home/bob/proj')) {
            for (const glob of rule.paths) {
                expect(glob.startsWith('/')).toBe(true)
            }
        }
    })

    it('toVirtualPath / fromVirtualPath bridge native and deepagents virtual paths', () => {
        // fromVirtualPath is a pure string transform: testable on every platform.
        expect(fromVirtualPath('/C:/Users/bob/proj/app.ts')).toBe('C:/Users/bob/proj/app.ts')
        expect(fromVirtualPath('/home/bob/proj/app.ts')).toBe('/home/bob/proj/app.ts')
        expect(fromVirtualPath('/')).toBe('/')
        // toVirtualPath translates only native Windows drive paths (no
        // `path.resolve`), so the transform is testable on every platform.
        expect(toVirtualPath('C:\\Users\\bob\\proj\\app.ts')).toBe('/C:/Users/bob/proj/app.ts')
        expect(toVirtualPath('C:/Users/bob/proj')).toBe('/C:/Users/bob/proj')
        // relative and POSIX-absolute input is left untouched (deepagents rejects
        // relative paths itself); already-virtual input is idempotent.
        expect(toVirtualPath('relative/file.ts')).toBe('relative/file.ts')
        expect(toVirtualPath('/home/bob/proj')).toBe('/home/bob/proj')
        expect(toVirtualPath('/C:/Users/bob/proj')).toBe('/C:/Users/bob/proj')
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
    it('denies reads and writes outside projectRoot, allows both inside', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-scope-'))
        const insideFile = path.join(projRoot, 'app.txt')
        const envFile = path.join(projRoot, '.env')
        const outsideFile = path.join(os.tmpdir(), 'deepagent-scope-evil.txt')
        await fs.writeFile(insideFile, 'project data')
        await fs.writeFile(envFile, 'SECRET=1')
        try {
            const outsideRead = await runSingleTool('auto', projRoot, 'read_file', { path: '/etc/passwd' })
            expect(outsideRead).toMatch(/permission denied/)

            // sensitive-path deny rules win over the allow rule (first match)
            const envRead = await runSingleTool('auto', projRoot, 'read_file', { path: envFile })
            expect(envRead).toMatch(/permission denied/)

            const outsideWrite = await runSingleTool('auto', projRoot, 'write_file', {
                path: outsideFile,
                content: 'x',
            })
            expect(outsideWrite).toMatch(/permission denied/)
            await expect(fs.access(outsideFile)).rejects.toThrow()

            const insideRead = await runSingleTool('auto', projRoot, 'read_file', { path: insideFile })
            expect(insideRead).toContain('project data')

            const insideWrite = path.join(projRoot, 'written.txt')
            const writeResult = await runSingleTool('auto', projRoot, 'write_file', {
                path: insideWrite,
                content: 'ok',
            })
            expect(writeResult).toContain('Successfully wrote')
            expect(await fs.readFile(insideWrite, 'utf8')).toBe('ok')
        } finally {
            await fs.rm(projRoot, { recursive: true, force: true })
            await fs.rm(outsideFile, { force: true })
        }
    })

    it('propose mode denies writes inside the project root too', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-propose-'))
        try {
            const result = await runSingleTool('propose', projRoot, 'write_file', {
                path: path.join(projRoot, 'x.txt'),
                content: 'x',
            })
            expect(result).toMatch(/permission denied/)
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
                    args: { file_path: spec, old_string: 'const a = 1', new_string: 'const a = 2' },
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
                toolCalls: [[{ name: 'write_file', args: { path: target, content: 'null mcp ok' }, id: 'call-1' }]],
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
