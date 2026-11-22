import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * A stand-in for an OpenAI-compatible model server: it answers with token
 * probabilities that favor the option naming `favorite`. It proves what
 * `pick` sends and how it reads the answer, not how good a model is.
 */
function startModel (favorite: string): Promise<{ url: string, prompts: string[], favorite: string, close: () => Promise<void> }> {
    const prompts: string[] = []
    const model = { favorite }
    const server = http.createServer((req, res) => {
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
            const prompt: string = JSON.parse(body).messages.at(-1).content
            prompts.push(prompt)
            const options = [...prompt.matchAll(/^([A-Z])\. (.*)$/gm)]
            const top = options.map(([, label, text]) => ({ token: label, logprob: Math.log(text.includes(model.favorite) ? 0.9 : 0.1 / options.length) }))
                .sort((a, b) => b.logprob - a.logprob)
            res.writeHead(200, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ choices: [{ message: { content: top[0].token }, logprobs: { content: [{ ...top[0], top_logprobs: top }] } }] }))
        })
    })
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address() as AddressInfo
            resolve(Object.assign(model, { url: `http://127.0.0.1:${port}/v1`, prompts, close: () => new Promise<void>((done) => server.close(() => done())) }))
        })
    })
}

describe('wdio session pick', () => {
    let server: FixtureServer
    let model: Awaited<ReturnType<typeof startModel>>
    let project: Project

    const run = (...args: string[]) => project.run(args)

    beforeAll(async () => {
        server = await startServer()
        model = await startModel('Red Hoodie')
        project = createProject('pick')
        // the daemon reads the model server from the environment it was opened in
        const open = await project.run(['open', 'chrome', `${server.url}/cart.html`], { env: { WDIO_PICK_URL: model.url, WDIO_PICK_MODEL: 'stand-in' } })
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await model.close()
        await server.close()
    })

    it('picks one of two identical buttons by the text around it, and the pick acts', async () => {
        const snapshot = await run('snapshot', '-i')
        const hoodie = /button "Add to cart" \[ref=(e\d+)\] ∈ "Red Hoodie"/.exec(snapshot.stdout)![1]

        const picked = await run('pick', 'add', 'the', 'hoodie', 'to', 'the', 'cart', '--action', 'click')
        expect(picked.code, picked.stderr).toBe(0)
        expect(picked.stdout).toContain(`Picked ${hoodie} for "add the hoodie to the cart"`)
        expect(picked.stdout).toContain(`\`wdio session click ${hoodie}\` acts on it.`)

        const prompt = model.prompts.at(-1)!
        expect(prompt).toContain('"add the hoodie to the cart" (to click it)')
        expect(prompt).toMatch(/^[A-Z]\. button "Add to cart" ∈ "Blue T-Shirt"/m)
        expect(prompt).not.toContain('url=')

        const clicked = await run('click', hoodie)
        expect(clicked.code, clicked.stderr).toBe(0)
        expect((await run('get', 'text', '#cart-link')).stdout.split('\n')[0]).toBe('Cart (1)')
    })

    it('prints the candidates as JSON', async () => {
        model.favorite = 'Remove Red Hoodie'
        const picked = await run('pick', 'remove the hoodie', '--json')
        expect(picked.code, picked.stderr).toBe(0)
        const { result } = JSON.parse(picked.stdout)
        expect(result.data.model).toBe('stand-in')
        expect(result.data.candidates[0].label).toBe('button "Remove Red Hoodie"')
        expect(result.data.candidates[0].probability).toBeGreaterThan(0.6)
        expect(result.data.picked).toBe(result.data.candidates[0].ref)
    })

    it('fails with the candidates when no pick is confident', async () => {
        model.favorite = 'Red Hoodie'
        const picked = await run('pick', 'add the hoodie to the cart', '--min-confidence', '0.99')
        expect(picked.code).toBe(1)
        expect(picked.stderr).toContain('No confident pick for "add the hoodie to the cart"')
        expect(picked.stderr).toContain('∈ "Red Hoodie"')
    })

    it('says how to configure a model server when the flags name none that answers', async () => {
        const picked = await run('pick', 'checkout', '--url', 'http://127.0.0.1:9/v1', '--model', 'none')
        expect(picked.code).toBe(3)
        expect(picked.stderr).toContain('did not answer')
    })
})
