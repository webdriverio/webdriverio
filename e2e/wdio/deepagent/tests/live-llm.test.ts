/**
 * Tier T0 — real-LLM smoke (manual; human + key, NEVER CI).
 *
 * Exercises the real agent capabilities end-to-end against a live
 * Anthropic-compatible BYOK endpoint (e.g. DeepSeek):
 *
 *   export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
 *   export ANTHROPIC_AUTH_TOKEN="sk-…"            # accepted by the endpoint
 *   export ANTHROPIC_MODEL="deepseek-v4-flash"
 *
 * The suite shims `ANTHROPIC_AUTH_TOKEN` into `ANTHROPIC_API_KEY` because
 * the resolver (`src/model/resolver.ts`) and the installed langchain
 * `ChatAnthropic` read the API-key variable. Everything is env-driven — the
 * token never appears in this file. The tier is skipped when no key/base
 * URL is present.
 *
 * T0-03 is the real-model CLI run (E2E-17 in the plan): with the fake-model
 * env hook gone, the CLI run case belongs here, next to the other live
 * paths, instead of in the deterministic T3 tier.
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { runMission } from '@wdio/deepagent/commands/run'
import { runDiagnosis } from '@wdio/deepagent/heal'
import { buildTraceZip } from '../fixtures/trace-builder.js'
import {
    DEEPAGENT_BIN,
    MCP_SERVER,
    buildHarness,
    makeTempDir,
    rmrf,
    spawnProcess,
} from '../helpers.js'

// ANTHROPIC_AUTH_TOKEN is the token DeepSeek's Anthropic-compatible endpoint
// expects; the resolver + ChatAnthropic read ANTHROPIC_API_KEY, so bridge them.
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN
}

const LIVE = Boolean(process.env.ANTHROPIC_BASE_URL) && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
const MODEL = {
    provider: 'anthropic' as const,
    model: process.env.ANTHROPIC_MODEL ?? 'deepseek-v4-flash',
}

/** Child-process env with the provider selection + key bridge applied. */
function childEnv(): Record<string, string | undefined> {
    const env: Record<string, string | undefined> = {
        ...process.env,
        DEEPAGENT_MODEL: `anthropic:${MODEL.model}`,
    }
    if (env.ANTHROPIC_AUTH_TOKEN && !env.ANTHROPIC_API_KEY) {
        env.ANTHROPIC_API_KEY = env.ANTHROPIC_AUTH_TOKEN
    }
    return env
}

describe.runIf(LIVE)('Tier T0 — live LLM agent capabilities (manual)', () => {
    let tmp: string
    let logFile: string

    beforeAll(async () => {
        tmp = await makeTempDir('t0-')
        logFile = path.join(tmp, 'calls.ndjson')
    })

    afterAll(async () => {
        delete process.env.FIXTURE_LOG
        await rmrf(tmp)
    })

    it('T0-01 real model plans + writes a file with exact content (fs tools)', async () => {
        const target = path.join(tmp, 'notes.md')
        const harness = await buildHarness(
            [[]],
            {
                model: MODEL,
                mcp: { command: process.execPath, args: [MCP_SERVER] },
                projectRoot: tmp,
            },
        )
        try {
            const result = await runMission(
                harness.agent,
                `Create a file at the absolute path ${JSON.stringify(target)} containing exactly this text: deepseek e2e ok`,
            )
            expect(result.exitCode).toBe(0)
            expect(result.toolCalls.some((c) => c.name === 'write_file')).toBe(true)
        } finally {
            await harness.close()
        }
        expect(await fs.readFile(target, 'utf8')).toContain('deepseek e2e ok')
    })

    it('T0-02 real model calls an MCP tool (tool-calling over the fixture server)', async () => {
        process.env.FIXTURE_LOG = logFile
        const harness = await buildHarness(
            [[]],
            {
                model: MODEL,
                mcp: { command: process.execPath, args: [MCP_SERVER] },
                projectRoot: tmp,
            },
        )
        try {
            const result = await runMission(
                harness.agent,
                'Use the fixture_navigate tool to navigate to https://example.com, then stop. Do not use any other tools.',
            )
            expect(result.exitCode).toBe(0)
            expect(result.toolCalls.some((c) => c.name === 'fixture_navigate')).toBe(true)
            const calls = (await fs.readFile(logFile, 'utf8')).trim().split('\n').map((l) => JSON.parse(l))
            expect(calls.some((c) => c.name === 'fixture_navigate')).toBe(true)
        } finally {
            await harness.close()
            delete process.env.FIXTURE_LOG
        }
    })

    it('T0-03 CLI process level: DEEPAGENT_MODEL + env → real BYOK run', async () => {
        const project = await makeTempDir('t0-cli-')
        try {
            const config = path.join(project, 'wdio.conf.ts')
            await fs.writeFile(config, `export const config = {
    specs: [],
    capabilities: {},
    deepagent: {
        heal: 'auto',
        mcp: { command: ${JSON.stringify(process.execPath)}, args: [${JSON.stringify(MCP_SERVER)}] },
    },
}`)
            const target = path.join(project, 'cli-notes.txt')
            const res = await spawnProcess(process.execPath, [
                DEEPAGENT_BIN, 'run', '--config', config,
                `Create a file at the absolute path ${JSON.stringify(target)} containing exactly: cli live ok`,
            ], { cwd: project, timeoutMs: 120000, env: childEnv() })
            expect(res.code, `stderr: ${res.stderr.slice(-300)}`).toBe(0)
            expect(await fs.readFile(target, 'utf8')).toContain('cli live ok')
        } finally {
            await rmrf(project)
        }
    })

    it('T0-04 heals a faulty trace: live LLM fixes the failing spec from the transcript', async () => {
        // Live models vary: retry a few fresh attempts (each capped) until the
        // spec actually gets fixed. Manual tier, so a generous budget is fine.
        for (let attempt = 1; attempt <= 3; attempt++) {
            const project = await makeTempDir('t0-heal-')
            try {
                // trace.zip whose transcript.md records a failing click on `#login-btn`
                const tracePath = path.join(project, 'trace-failing.zip')
                await fs.writeFile(tracePath, buildTraceZip())

                // faulty spec: selector typo (#login) that does not match the trace
                const specPath = path.join(project, 'login.spec.ts')
                await fs.writeFile(specPath, `import { browser, expect } from '@wdio/globals'

describe('login flow', () => {
    it('logs the user in', async () => {
        await browser.url('https://example.com')
        await browser.$('#login').click()
        await expect(browser.$('#status')).toHaveText('logged in')
    })
})
`)

                // In-process diagnose (same engine as the CLI) with `mcp: null`:
                // the live model has fs + trace + knowledge-base tools only — no
                // browser surface, so it fixes the spec from the transcript instead
                // of roaming.
                //
                // Finding: the shipped DEFAULT_HEAL_PROMPT omits the transcript, so
                // a live model gets only "click #login-btn failed" and stalls trying
                // to explore the app. We inject the transcript via the engine's
                // documented `healPrompt` hook; feeding the transcript into the
                // default prompt is a product improvement worth making (README).
                const healPrompt = (report: { transcript: string; failedActions: Array<{ name?: string; selector?: string; error?: string }>; networkErrors: Array<{ url?: string; status?: number }> }) =>
                    `A WebdriverIO run failed. Fix the failing spec at ${JSON.stringify(specPath)} so the run passes.

Do NOT launch a browser, do NOT run or reproduce the spec, and do NOT use trace or knowledge tools — nothing can be executed in this environment. Everything you need is in the trace below; apply the fix directly with write_file and stop. Do not create additional files.

Transcript of the failed run:
${report.transcript}

Failed actions: ${JSON.stringify(report.failedActions.map((a) => ({ name: a.name, selector: a.selector, error: a.error })))}
Network errors: ${JSON.stringify(report.networkErrors.map((n) => ({ url: n.url, status: n.status })))}

Fix the spec file now, then reply with a one-line summary of what you changed and why.`

                const harness = await buildHarness(
                    [[]],
                    {
                        // deepseek-v4-flash reasons first; the old 1024-token default
                        // cap left nothing for the actual write (thinking-only
                        // replies); the default is now 8192 — keep the explicit cap
                        // for determinism.
                        model: { ...MODEL, maxTokens: 8192 },
                        // mcp: null — fs + trace + knowledge-base tools only, no
                        // browser surface: the live model heals the spec from the
                        // transcript.
                        mcp: null,
                        projectRoot: project,
                        heal: 'auto',
                    },
                )
                let report
                try {
                    try {
                        report = await Promise.race([
                            runDiagnosis({
                                tracePath,
                                traceDir: path.join(project, 'traces'),
                                heal: 'auto',
                                agent: harness.agent,
                                healPrompt,
                            }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('attempt cap')), 150000)),
                        ])
                    } catch {
                        report = undefined // capped attempt → retry
                    }
                } finally {
                    await harness.close()
                }
                const fixed = await fs.readFile(specPath, 'utf8')
                if (report && fixed.includes('#login-btn') && !fixed.includes("$('#login')")) {
                    expect(report.agentRan).toBe(true)
                    return
                }
                // no fix this attempt → retry with a fresh project + harness
            } finally {
                await rmrf(project)
            }
        }
        expect.fail('live LLM did not fix the spec after 3 attempts')
    }, 480000)
})
