import { describe, expect, it } from 'vitest'

import { inViewport } from '../src/viewport.js'

describe('inViewport', () => {
    it('keeps elements overlapping the viewport, with their text', () => {
        const tree = {
            role: 'document',
            children: [
                { role: 'heading', name: 'Above', box: [0, -400, 800, 40], children: [{ role: 'text', name: 'Above' }] },
                { role: 'paragraph', box: [0, 100, 800, 60], children: [{ role: 'text', name: 'Visible text' }] },
                { role: 'button', name: 'Buy', ref: 'e4', box: [10, 700, 80, 30] },
                { role: 'link', name: 'Below', ref: 'e5', box: [0, 1200, 100, 20] }
            ]
        }
        const view = inViewport(tree, 1280, 800)!
        expect(view.children!.map((c) => c.role)).toEqual(['paragraph', 'button'])
        expect(view.children![0].children).toEqual([{ role: 'text', name: 'Visible text' }])
    })

    it('leaves out text directly in a container taller than the viewport', () => {
        const tree = { role: 'main', box: [0, -2000, 800, 4000], children: [{ role: 'text', name: 'Somewhere in main' }, { role: 'button', name: 'Buy', ref: 'e4', box: [0, 100, 80, 30] }] }
        expect(inViewport(tree, 1280, 800)!.children!.map((c) => c.role)).toEqual(['button'])
    })

    it('keeps a partly visible element and the ancestors of what it keeps, drops what is off screen', () => {
        const tree = {
            role: 'document',
            children: [
                { role: 'main', box: [0, -50, 800, 5000], children: [
                    { role: 'section', box: [0, 780, 800, 100], children: [{ role: 'button', name: 'Edge', ref: 'e1', box: [0, 790, 80, 30] }] },
                    { role: 'section', box: [0, 3000, 800, 100], children: [{ role: 'button', name: 'Far', ref: 'e2', box: [0, 3010, 80, 30] }] }
                ] }
            ]
        }
        const view = inViewport(tree, 1280, 800)!
        const main = view.children![0]
        expect(main.children!.map((c) => c.children![0].name)).toEqual(['Edge'])
    })
})
