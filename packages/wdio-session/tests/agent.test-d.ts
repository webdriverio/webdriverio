import { describe, expectTypeOf, it } from 'vitest'

import type { ActionArgsOf, AgentActionName } from '../src/actions/args.js'
import type { AgentSession } from '../src/agent.js'

declare const agent: AgentSession

describe('action args types', () => {
    it('click requires target', () => {
        expectTypeOf<ActionArgsOf<'click'>>().toMatchTypeOf<{ target: string }>()
        expectTypeOf<ActionArgsOf<'click'>['double']>().toEqualTypeOf<boolean | undefined>()
        expectTypeOf<ActionArgsOf<'click'>['newTab']>().toEqualTypeOf<boolean | undefined>()
        // @ts-expect-error target is required
        const missing: ActionArgsOf<'click'> = {}
        void missing
    })

    it('fill takes target and text', () => {
        expectTypeOf<ActionArgsOf<'fill'>>().toEqualTypeOf<{ target: string, text: string }>()
    })

    it('snapshot options are optional and camelCased', () => {
        expectTypeOf<{ interactive: true }>().toMatchTypeOf<ActionArgsOf<'snapshot'>>()
        expectTypeOf<ActionArgsOf<'snapshot'>['maxChars']>().toEqualTypeOf<number | undefined>()
        expectTypeOf<ActionArgsOf<'snapshot'>['fileOnly']>().toEqualTypeOf<boolean | undefined>()
    })

    it('pick takes an intent and narrows the action', () => {
        expectTypeOf<ActionArgsOf<'pick'>['intent']>().toEqualTypeOf<string>()
        expectTypeOf<ActionArgsOf<'pick'>['action']>().toEqualTypeOf<'click' | 'fill' | 'select' | 'check' | 'hover' | undefined>()
        expectTypeOf<ActionArgsOf<'pick'>['minConfidence']>().toEqualTypeOf<number | undefined>()
    })

    it('pick data names the picked ref', async () => {
        const { data } = await agent.run('pick', { intent: 'add to cart' })
        expectTypeOf(data!.picked).toEqualTypeOf<string>()
        expectTypeOf(data!.candidates[0].probability).toEqualTypeOf<number | undefined>()
    })

    it('choices narrow the value', () => {
        expectTypeOf<ActionArgsOf<'rotate'>['orientation']>().toEqualTypeOf<'portrait' | 'landscape'>()
    })

    it('agent action names exclude local actions', () => {
        expectTypeOf<'click'>().toMatchTypeOf<AgentActionName>()
        // @ts-expect-error not an action
        expectTypeOf<'clickk'>().toMatchTypeOf<AgentActionName>()
        // @ts-expect-error `open` is local
        expectTypeOf<'open'>().toMatchTypeOf<AgentActionName>()
    })

    it('run requires args only when the action has required keys', () => {
        // @ts-expect-error click requires target
        void agent.run('click')
        void agent.run('click', { target: 'e3' })
        void agent.run('snapshot')
        void agent.run('snapshot', { interactive: true })
    })
})
