import { describe, expect, it, vi } from 'vitest'

import { openAIDecider, resolveDecider, type Decider } from '../src/decider.js'
import { cliCmd } from '../src/hints.js'

function completion (body: unknown, status = 200) {
    return vi.fn(async () => new Response(JSON.stringify(body), { status }))
}

describe('openAIDecider', () => {
    const question = { instructions: 'Which one?', options: { A: 'button "Buy"', B: 'link "Cart"' } }

    it('asks for one token with probabilities and without thinking', async () => {
        const fetch = completion({ choices: [{ message: { content: 'A' }, logprobs: { content: [{ token: 'A', logprob: Math.log(0.9), top_logprobs: [{ token: 'A', logprob: Math.log(0.9) }, { token: 'B', logprob: Math.log(0.1) }] }] } }] })
        const decider = openAIDecider({ url: 'http://localhost:8080/v1/', model: 'qwen3.5-4b', apiKey: 'key', fetch })
        const decision = await decider.decide(question)
        expect(decision.choice).toBe('A')
        expect(decision.probabilities!.A).toBeCloseTo(0.9)
        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
        expect(url).toBe('http://localhost:8080/v1/chat/completions')
        expect((init.headers as Record<string, string>).authorization).toBe('Bearer key')
        expect(JSON.parse(init.body as string)).toMatchObject({
            model: 'qwen3.5-4b',
            max_tokens: 1,
            temperature: 0,
            logprobs: true,
            chat_template_kwargs: { enable_thinking: false }
        })
    })

    function answering (top: { token: string, logprob: number }[]) {
        return completion({ choices: [{ message: { content: top[0].token }, logprobs: { content: [{ ...top[0], top_logprobs: top }] } }] })
    }

    it('normalizes over the offered labels and ignores other tokens', async () => {
        const fetch = answering([
            { token: 'A', logprob: Math.log(0.6) },
            { token: ' B', logprob: Math.log(0.2) },
            { token: 'The', logprob: Math.log(0.2) }
        ])
        const { probabilities } = await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide({ ...question, options: { ...question.options, C: 'link "Help"' } })
        expect(probabilities!.A).toBeCloseTo(0.75)
        expect(probabilities!.B).toBeCloseTo(0.25)
        expect(probabilities!.C).toBe(0)
    })

    it('keeps the best of tokens that trim to the same label', async () => {
        const fetch = answering([{ token: 'A', logprob: Math.log(0.5) }, { token: ' A', logprob: Math.log(0.1) }, { token: 'B', logprob: Math.log(0.5) }])
        const { probabilities } = await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide(question)
        expect(probabilities!.A).toBeCloseTo(0.5)
    })

    it('lists the options before the question, so a cached prompt prefix holds the page', async () => {
        const fetch = answering([{ token: 'A', logprob: 0 }])
        await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide({ ...question, context: 'Page: https://shop.test/' })
        const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
        expect(body.messages[1].content).toBe('Page: https://shop.test/\n\nOptions:\nA. button "Buy"\nB. link "Cart"\n\nWhich one?\n\nAnswer with one label.')
    })

    it('chooses the most probable label, not the sampled token', async () => {
        const fetch = completion({ choices: [{ message: { content: 'x' }, logprobs: { content: [{ token: 'x', logprob: Math.log(0.5), top_logprobs: [{ token: 'B', logprob: Math.log(0.3) }, { token: 'A', logprob: Math.log(0.1) }] }] } }] })
        const decision = await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide(question)
        expect(decision.choice).toBe('B')
    })

    it('treats an answer without a label among its tokens as unscored', async () => {
        const fetch = completion({ choices: [{ message: { content: 'B' }, logprobs: { content: [{ token: '<think>', logprob: 0, top_logprobs: [] }] } }] })
        expect(await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide(question)).toEqual({ choice: 'B' })
    })

    it('returns an unscored choice when the server sends no probabilities', async () => {
        const fetch = completion({ choices: [{ message: { content: 'B.' } }] })
        const decision = await openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide(question)
        expect(decision).toEqual({ choice: 'B' })
    })

    it('fails on an answer that is no option', async () => {
        const fetch = completion({ choices: [{ message: { content: 'Sure' } }] })
        await expect(openAIDecider({ url: 'http://m/v1', model: 'm', fetch }).decide(question)).rejects.toThrow('which is no option')
    })

    it('reports a server that is down or fails', async () => {
        const down = vi.fn(async () => { throw new Error('ECONNREFUSED') })
        await expect(openAIDecider({ url: 'http://m/v1', model: 'm', fetch: down }).decide(question)).rejects.toMatchObject({ code: 'MISSING_DEPENDENCY' })
        const failing = completion({ error: 'no such model' }, 404)
        await expect(openAIDecider({ url: 'http://m/v1', model: 'm', fetch: failing }).decide(question)).rejects.toThrow('answered 404')
    })
})

describe('resolveDecider', () => {
    const configured: Decider = { name: 'own', decide: async () => ({ choice: 'A' }) }

    it('prefers the decider the agent session was created with', () => {
        expect(resolveDecider(configured, {}, cliCmd, {})).toBe(configured)
    })

    it('uses flags over the environment', () => {
        expect(resolveDecider(configured, { url: 'http://m/v1', model: 'flag' }, cliCmd, {}).name).toBe('flag')
        expect(resolveDecider(undefined, {}, cliCmd, { WDIO_PICK_URL: 'http://m/v1', WDIO_PICK_MODEL: 'env' }).name).toBe('env')
    })

    it('says how to configure one when there is none', () => {
        expect(() => resolveDecider(undefined, {}, cliCmd, {})).toThrow('`pick` needs a decision model')
    })
})
