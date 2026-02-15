import { describe, it, expect, vi } from 'vitest'
import { getMobileVisibleElements } from '../../src/snapshot/mobile.js'

describe('getMobileVisibleElements', () => {
    it('should parse page source and return elements', async () => {
        const mockBrowser = {
            getWindowSize: vi.fn().mockResolvedValue({ width: 390, height: 844 }),
            getPageSource: vi.fn().mockResolvedValue(
                '<hierarchy><android.widget.Button resource-id="com.example:id/submit" text="Submit" bounds="[0,0][200,50]" clickable="true" enabled="true" displayed="true" /></hierarchy>'
            ),
        } as any

        const result = await getMobileVisibleElements(mockBrowser, 'android')
        expect(result.length).toBeGreaterThan(0)
        expect(result[0].tagName).toBe('android.widget.Button')
        expect(result[0].text).toBe('Submit')
    })
})
