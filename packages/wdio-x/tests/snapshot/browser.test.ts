import { describe, it, expect, vi } from 'vitest'
import { getBrowserInteractableElements } from '../../src/snapshot/browser.js'

describe('getBrowserInteractableElements', () => {
    it('should call browser.execute and return elements', async () => {
        const mockElements = [
            { tagName: 'button', type: '', textContent: 'Submit', cssSelector: 'button.submit', isInViewport: true, id: '', className: '', value: '', placeholder: '', href: '', ariaLabel: '', role: '', src: '', alt: '' },
        ]
        const mockBrowser = {
            execute: vi.fn().mockResolvedValue(mockElements),
        } as any

        const result = await getBrowserInteractableElements(mockBrowser)
        expect(result).toEqual(mockElements)
        expect(mockBrowser.execute).toHaveBeenCalledOnce()
    })
})
