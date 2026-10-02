import type { StructuredToolInterface } from '@langchain/core/tools'
import type { z as Zod, ZodTypeAny } from 'zod'
import type { ActionSpec, AgentSession } from '@wdio/session/agent'

import { redact, substitute } from './redact.js'
import type { ActStep, StepTarget } from './types.js'
import type { Workspace } from './workspace.js'
import { describeEffect, isEmpty } from './effects.js'
import type { EffectRecorder } from './recorder.js'

/**
 * `@wdio/session` actions the model may use. Code execution, cookies,
 * storage, mocks, emulation, app installs, uploads and closing the session
 * are left out on purpose.
 */
export const DEFAULT_ACTIONS = [
    'snapshot', 'find', 'click', 'tap', 'fill', 'type', 'press', 'select', 'check', 'uncheck', 'hover',
    'scroll', 'swipe', 'long-press', 'drag', 'navigate', 'back', 'wait', 'frame', 'tabs', 'dialog'
]

/**
 * actions that move between frames and tabs, recorded even without code
 */
const CONTEXT_ACTIONS = new Set(['frame', 'tabs'])
/**
 * `tabs` without one of these only lists the tabs
 */
const TAB_CHANGES = new Set(['switch', 'new', 'close'])

/**
 * A step a replay has to take: a page action, or a move to another frame
 * or tab. `tabs switch` is not a page mutation, but later steps run in the
 * tab it switched to.
 */
function isStep (spec: { name: string, mutation?: boolean }, input: Record<string, unknown>) {
    if (spec.name === 'tabs') {
        return TAB_CHANGES.has(input.sub as string)
    }
    return Boolean(spec.mutation)
}
/**
 * `frame top` and `frame parent` name no element, there is nothing to heal
 */
const FRAME_KEYWORDS = new Set(['top', 'parent'])
const REF = /^@?e\d+$/

export interface ToolContext {
    agent: AgentSession
    /**
     * values for `{{placeholders}}`
     */
    values: Record<string, string>
    /**
     * allowlist of actions, default `DEFAULT_ACTIONS`
     */
    actions?: string[]
    /**
     * called for every step that changed the page and ran WebdriverIO code
     */
    onStep: (step: ActStep) => void
    /**
     * evidence folder: snapshots are saved there and long output moves there
     */
    workspace?: Workspace
    /**
     * ref of the element `act` was called on, every snapshot is limited to it
     */
    scope?: string
    /**
     * records what each step did, and waits until it settled
     */
    effects?: EffectRecorder
}

/**
 * LangChain and zod are imported on the first model call only, a run that
 * replays every step from the cache never loads them
 */
async function loadToolKit () {
    const [{ tool }, { z }] = await Promise.all([import('@langchain/core/tools'), import('zod')])
    return { tool, z }
}

function optionSchema (z: typeof Zod, option: { type?: string, choices?: unknown[], desc?: string, describe?: string }) {
    const description = option.desc || option.describe || ''
    if (Array.isArray(option.choices) && option.choices.length) {
        return z.enum(option.choices.map(String) as [string, ...string[]]).optional().describe(description)
    }
    switch (option.type) {
    case 'boolean':
        return z.boolean().optional().describe(description)
    case 'number':
        return z.number().optional().describe(description)
    default:
        return z.string().optional().describe(description)
    }
}

/**
 * zod schema of an action from its positionals and options
 */
export function actionSchema (z: typeof Zod, spec: ActionSpec) {
    const shape: Record<string, ZodTypeAny> = {}
    for (const positional of spec.positionals || []) {
        const base = positional.choices?.length
            ? z.enum(positional.choices as [string, ...string[]])
            : z.string()
        shape[positional.name] = (positional.required ? base : base.optional()).describe(positional.desc)
    }
    for (const [name, option] of Object.entries(spec.options || {})) {
        shape[name] = optionSchema(z, option as { type?: string, choices?: unknown[], desc?: string })
    }
    return z.object(shape)
}

/**
 * the selector and the selector candidates of a target the model used
 */
function describeTarget (agent: AgentSession, target: unknown): StepTarget | undefined {
    if (typeof target !== 'string' || !target) {
        return undefined
    }
    if (!REF.test(target)) {
        return { selector: target, candidates: [target] }
    }
    const entry = agent.ref(target)
    if (!entry) {
        return undefined
    }
    const selector = entry.selector || entry.candidates[0]
    return {
        selector,
        ...(entry.role ? { role: entry.role } : {}),
        ...(entry.name ? { name: entry.name } : {}),
        candidates: entry.candidates
    }
}

/**
 * Replace refs in recorded arguments with their selector, so the step can
 * replay without a snapshot.
 */
function recordedArgs (agent: AgentSession, input: Record<string, unknown>) {
    const args: Record<string, unknown> = { ...input }
    for (const key of ['target', 'from', 'to']) {
        const target = describeTarget(agent, args[key])
        if (target) {
            args[key] = target.selector
        }
    }
    return args
}

/**
 * LangChain tools for the page actions of an `AgentSession`.
 */
export async function pageTools (context: ToolContext): Promise<StructuredToolInterface[]> {
    const { tool, z } = await loadToolKit()
    const allowed = new Set(context.actions || DEFAULT_ACTIONS)
    /**
     * the diff after an action uses the scope and filter of the last snapshot
     */
    let diffArgs: Record<string, unknown> = context.scope ? { scope: context.scope } : {}
    return context.agent.actions
        .filter((spec) => allowed.has(spec.name))
        .map((spec) => tool(async (input: Record<string, unknown>) => {
            const { agent, values } = context
            try {
                const args = spec.name === 'snapshot' && context.scope && !input.scope
                    ? { ...input, scope: context.scope }
                    : input
                const step = isStep(spec, input)
                if (step) {
                    await context.effects?.start()
                }
                const result = await agent.run(spec.name, substitute(args, values))
                const effect = step && context.effects ? redact(await context.effects.settle(), values) : undefined
                if (spec.name === 'snapshot') {
                    diffArgs = {
                        ...(typeof args.scope === 'string' ? { scope: args.scope } : {}),
                        ...(args.interactive ? { interactive: true } : {})
                    }
                }
                let text = result.text || 'done'
                if (step) {
                    /**
                     * Moving back to the top document or an already declared
                     * tab emits no code, but a replay still has to take it.
                     */
                    if (result.code || CONTEXT_ACTIONS.has(spec.name)) {
                        const target = spec.name === 'frame' && FRAME_KEYWORDS.has(input.target as string)
                            ? undefined
                            : describeTarget(agent, input.target)
                        context.onStep({
                            action: spec.name,
                            args: redact(recordedArgs(agent, input), values),
                            code: redact(result.code || '', values),
                            ...(target ? { target } : {}),
                            ...(effect && !isEmpty(effect) ? { effect } : {})
                        })
                    }
                    if (effect && !isEmpty(effect)) {
                        text += `\nEffect: ${describeEffect(effect)}`
                    }
                    const diff = await agent.run('diff', diffArgs).catch(() => undefined)
                    if (diff?.text) {
                        text += `\n${diff.text}`
                    }
                }
                if (context.workspace) {
                    if (spec.name === 'snapshot') {
                        await context.workspace.writeSnapshot(text)
                    }
                    text = await context.workspace.inline(spec.name, text)
                }
                return redact(text, values)
            } catch (err) {
                return `Error: ${redact((err as Error).message, values)}`
            }
        }, {
            name: spec.name,
            description: spec.desc,
            schema: actionSchema(z, spec)
        }))
        .concat(context.workspace ? [sourceTool(context, tool, z)] : [])
}

/**
 * save the page source into the workspace instead of the prompt
 */
function sourceTool (context: ToolContext, tool: Awaited<ReturnType<typeof loadToolKit>>['tool'], z: typeof Zod) {
    return tool(async () => {
        try {
            const { agent } = context
            const source = agent.scope === agent.browser
                ? await agent.browser.getPageSource()
                : await agent.scope.execute(() => document.documentElement.outerHTML)
            const native = !context.agent.session.plan.applies.includes('W')
            const file = await context.workspace!.writeSource(source, native)
            return `Saved the ${native ? 'app source' : 'page HTML'} (${source.length} characters) to ${file}. Search it with grep or read parts of it with read_file.`
        } catch (err) {
            return `Error: ${redact((err as Error).message, context.values)}`
        }
    }, {
        name: 'source',
        description: 'Save the page HTML or app source to the workspace, for searching attributes and text that the snapshot leaves out',
        schema: z.object({})
    })
}

export interface Outcome {
    status?: 'done' | 'fail'
    summary?: string
}

/**
 * `done` and `fail` end the loop
 */
export async function controlTools (outcome: Outcome): Promise<StructuredToolInterface[]> {
    const { tool, z } = await loadToolKit()
    return [
        tool(async ({ summary }: { summary: string }) => {
            outcome.status = 'done'
            outcome.summary = summary
            return summary
        }, {
            name: 'done',
            description: 'Call this when the instruction is complete. Describe in one sentence what you did.',
            schema: z.object({ summary: z.string().describe('what you did') }),
            returnDirect: true
        }),
        tool(async ({ reason }: { reason: string }) => {
            outcome.status = 'fail'
            outcome.summary = reason
            return reason
        }, {
            name: 'fail',
            description: 'Call this when the instruction cannot be completed on this page. Explain why.',
            schema: z.object({ reason: z.string().describe('why the instruction cannot be completed') }),
            returnDirect: true
        })
    ]
}
