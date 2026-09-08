import { describe, expect, it } from 'vitest'
import { createKnowledgeBaseTools } from '../src/knowledge-base/tools.js'

const parse = (res: unknown): { found: boolean; url?: string } => JSON.parse(String(res))

describe('knowledge-base tools', () => {
    it('remember then query with relative vs absolute URL hits the same entry', async () => {
        const [remember, query] = createKnowledgeBaseTools()
        await remember.invoke({ url: 'https://host/products', snapshot: 'a11y tree', elements: '[]' })
        const res = await query.invoke({ url: '/products' })
        expect(parse(res)).toMatchObject({ found: true, url: 'https://host/products' })
    })

    it('evicts the oldest entry beyond the cap', async () => {
        const [remember, query] = createKnowledgeBaseTools()
        for (let i = 0; i < 40; i++) {
            await remember.invoke({ url: `https://host/p${i}`, snapshot: 'x', elements: '' })
        }
        expect(parse(await query.invoke({ url: 'https://host/p0' }))).toMatchObject({ found: false })
        expect(parse(await query.invoke({ url: 'https://host/p39' }))).toMatchObject({ found: true })
    })
})
