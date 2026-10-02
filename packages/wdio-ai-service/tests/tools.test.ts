import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ACTIONS } from '@wdio/session'

import { actionSchema, controlTools, DEFAULT_ACTIONS, pageTools, type Outcome } from '../src/tools.js'
import type { ActStep } from '../src/types.js'
import { fakeAgent } from './__fixtures__/agent.js'

const spec = (name: string) => ACTIONS.find((action) => action.name === name)!

describe('actionSchema', () => {
    it('makes required positionals required and options optional', () => {
        const fill = actionSchema(z, spec('fill'))
        expect(fill.safeParse({ target: 'e1', text: 'hi' }).success).toBe(true)
        expect(fill.safeParse({ target: 'e1' }).success).toBe(false)

        const click = actionSchema(z, spec('click'))
        expect(click.safeParse({ target: 'e1', double: true }).success).toBe(true)
        expect(click.safeParse({ target: 'e1', double: 'yes' }).success).toBe(false)
    })

    it('limits choices to the allowed values', () => {
        const swipe = actionSchema(z, spec('swipe'))
        expect(swipe.safeParse({ direction: 'up' }).success).toBe(true)
        expect(swipe.safeParse({ direction: 'diagonal' }).success).toBe(false)
    })
})

describe('pageTools', () => {
    it('offers the allowed actions that apply to the platform', async () => {
        const { agent } = fakeAgent()
        const names = (await pageTools({ agent, values: {}, onStep: () => {} })).map((t) => t.name)
        expect(names).toEqual(expect.arrayContaining(['snapshot', 'click', 'fill', 'navigate']))
        expect(names).not.toContain('exec')
        expect(names).not.toContain('cookies')
        expect(names).not.toContain('tap')
        expect(names.every((name) => DEFAULT_ACTIONS.includes(name))).toBe(true)

        const narrowed = await pageTools({ agent, values: {}, actions: ['snapshot', 'click'], onStep: () => {} })
        expect(narrowed.map((t) => t.name)).toEqual(['snapshot', 'click'])
    })

    it('records a mutating step with the stable selector of the ref and appends the page diff', async () => {
        const { agent, run, setRef } = fakeAgent((action) => {
            if (action === 'click') {
                return { text: 'Clicked e3 (button "Add to cart")', code: 'await $(\'role/button[name="Add to cart"]\').click()' }
            }
            if (action === 'diff') {
                return { text: '+ status "Cart (1)"' }
            }
        })
        setRef({ id: 'e3', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]', 'aria/Add to cart'] })
        const steps: ActStep[] = []
        const click = (await pageTools({ agent, values: {}, onStep: (step) => steps.push(step) })).find((t) => t.name === 'click')!

        const output = await click.invoke({ target: 'e3' })
        expect(output).toBe('Clicked e3 (button "Add to cart")\n+ status "Cart (1)"')
        expect(run).toHaveBeenCalledWith('click', { target: 'e3' })
        expect(steps).toEqual([{
            action: 'click',
            args: { target: 'role/button[name="Add to cart"]' },
            code: 'await $(\'role/button[name="Add to cart"]\').click()',
            target: { selector: 'role/button[name="Add to cart"]', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]', 'aria/Add to cart'] }
        }])
    })

    it('substitutes values before the action and keeps them out of steps and tool output', async () => {
        const { agent, run, setRef } = fakeAgent((action, args) => {
            if (action === 'fill') {
                return { text: `Filled e1 with ${args.text}`, code: `await $('#password').setValue('${args.text}')` }
            }
        })
        setRef({ id: 'e1', role: 'textbox', name: 'Password', candidates: ['#password'] })
        const steps: ActStep[] = []
        const fill = (await pageTools({ agent, values: { password: 's3cr3t' }, onStep: (step) => steps.push(step) })).find((t) => t.name === 'fill')!

        const output = await fill.invoke({ target: 'e1', text: '{{password}}' })
        expect(run).toHaveBeenCalledWith('fill', { target: 'e1', text: 's3cr3t' })
        expect(output).not.toContain('s3cr3t')
        expect(output).toContain('{{password}}')
        expect(steps[0].code).toBe('await $(\'#password\').setValue(\'{{password}}\')')
        expect(steps[0].args).toEqual({ target: '#password', text: '{{password}}' })
    })

    it('records a move to the top document although it emits no code', async () => {
        const { agent } = fakeAgent((action) => action === 'frame' ? { text: 'Switched to the top document', code: '' } : undefined)
        const steps: ActStep[] = []
        const frame = (await pageTools({ agent, values: {}, onStep: (step) => steps.push(step) })).find((t) => t.name === 'frame')!

        await frame.invoke({ target: 'top' })
        expect(steps).toEqual([{ action: 'frame', args: { target: 'top' }, code: '' }])
    })

    it('does not record a read and returns action errors as text', async () => {
        const { agent } = fakeAgent((action) => action === 'click' ? { error: 'No element matches "#missing".' } : { text: '- button "Go" [ref=e1]' })
        const steps: ActStep[] = []
        const tools = await pageTools({ agent, values: {}, onStep: (step) => steps.push(step) })
        await expect(tools.find((t) => t.name === 'snapshot')!.invoke({})).resolves.toBe('- button "Go" [ref=e1]')
        await expect(tools.find((t) => t.name === 'click')!.invoke({ target: '#missing' })).resolves.toBe('Error: No element matches "#missing".')
        expect(steps).toEqual([])
    })
})

describe('controlTools', () => {
    it('sets the outcome and ends the loop', async () => {
        const outcome: Outcome = {}
        const [done, fail] = await controlTools(outcome)
        expect((done as { returnDirect?: boolean }).returnDirect).toBe(true)
        await done.invoke({ summary: 'Added the shirt' })
        expect(outcome).toEqual({ status: 'done', summary: 'Added the shirt' })
        await fail.invoke({ reason: 'There is no blue shirt' })
        expect(outcome).toEqual({ status: 'fail', summary: 'There is no blue shirt' })
    })
})
